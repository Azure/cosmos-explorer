import { Terminal } from "xterm";
import { Areas } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import {
  connectTerminal,
  provisionConsole,
  putEphemeralUserSettings,
  registerCloudShellProvider,
  verifyCloudShellProviderRegistration,
} from "./Data/CloudShellClient";
import { CloudShellProviderInfo, ProvisionConsoleResponse } from "./Models/DataModels";
import { AbstractShellHandler, START_MARKER } from "./ShellTypes/AbstractShellHandler";
import { getHandler } from "./ShellTypes/ShellTypeFactory";
import { AttachAddon } from "./Utils/AttachAddOn";
import { askConfirmation, wait } from "./Utils/CommonUtils";
import { getNormalizedRegion } from "./Utils/RegionUtils";
import { formatErrorMessage, formatInfoMessage, formatWarningMessage } from "./Utils/TerminalLogFormats";

// Constants
const DEFAULT_CLOUDSHELL_REGION = "westus";
const DEFAULT_FAIRFAX_CLOUDSHELL_REGION = "usgovvirginia";
const POLLING_INTERVAL_MS = 2000;
const MAX_RETRY_COUNT = 10;
const MAX_PING_COUNT = 120 * 60; // 120 minutes (60 seconds/minute)

let pingCount = 0;
let keepAliveID: NodeJS.Timeout = null;

/**
 * Main function to start a CloudShell terminal
 */
export const startCloudShellTerminal = async (terminal: Terminal, shellType: TerminalKind): Promise<WebSocket> => {
  const startKey = TelemetryProcessor.traceStart(Action.CloudShellTerminalSession, {
    shellType: TerminalKind[shellType],
    dataExplorerArea: Areas.CloudShell,
  });

  let resolvedRegion: string;
  try {
    await ensureCloudShellProviderRegistered();

    resolvedRegion = determineCloudShellRegion();

    terminal.writeln(formatWarningMessage("⚠️  IMPORTANT: Azure Cloud Shell Region Notice ⚠️"));
    terminal.writeln(
      formatInfoMessage(
        "The Cloud Shell environment will operate in a region that may differ from your database's region.",
      ),
    );
    terminal.writeln(formatInfoMessage("By using this feature, you acknowledge and agree to the following"));
    terminal.writeln(formatInfoMessage("1. Performance Impact:"));
    terminal.writeln(
      formatInfoMessage("   Commands may experience higher latency due to geographic distance between regions."),
    );
    terminal.writeln(formatInfoMessage("2. Data Transfers:"));
    terminal.writeln(
      formatInfoMessage(
        "   Data processed through this Cloud Shell service can be processed outside of your tenant's geographical region, compliance boundary or national cloud instance.",
      ),
    );
    terminal.writeln("");

    terminal.writeln("\x1b[94mFor more information on Azure Cosmos DB data residency, please visit:");
    terminal.writeln("\x1b[94mhttps://learn.microsoft.com/en-us/azure/cosmos-db/data-residency\x1b[0m");

    // Ask for user consent for region
    const consentGranted = await askConfirmation(terminal, formatWarningMessage("Do you wish to proceed?"));

    // Track user decision
    TelemetryProcessor.trace(
      Action.CloudShellUserConsent,
      consentGranted ? ActionModifiers.Success : ActionModifiers.Cancel,
      {
        dataExplorerArea: Areas.CloudShell,
        shellType: TerminalKind[shellType],
        isConsent: consentGranted,
        region: resolvedRegion,
      },
      startKey,
    );

    if (!consentGranted) {
      terminal.writeln(
        formatErrorMessage("Session ended. Please close this tab and initiate a new shell session if needed."),
      );
      return null; // Exit if user declined
    }

    terminal.writeln(formatInfoMessage("Connecting to CloudShell. This may take a moment. Please wait..."));

    const sessionDetails: {
      socketUri?: string;
      provisionConsoleResponse?: ProvisionConsoleResponse;
      targetUri?: string;
    } = await provisionCloudShellSession(resolvedRegion, terminal);

    if (!sessionDetails.socketUri) {
      terminal.writeln(formatErrorMessage("Failed to establish a connection. Please try again later."));
      return null;
    }

    // Get the shell handler for this type
    const shellHandler = await getHandler(shellType);
    // Configure WebSocket connection with shell-specific commands
    const socket = await establishTerminalConnection(terminal, shellHandler, sessionDetails.socketUri);

    TelemetryProcessor.traceSuccess(
      Action.CloudShellTerminalSession,
      {
        shellType: TerminalKind[shellType],
        dataExplorerArea: Areas.CloudShell,
        region: resolvedRegion,
        socketUri: sessionDetails.socketUri,
      },
      startKey,
    );

    return socket;
  } catch (err) {
    TelemetryProcessor.traceFailure(
      Action.CloudShellTerminalSession,
      {
        shellType: TerminalKind[shellType],
        dataExplorerArea: Areas.CloudShell,
        region: resolvedRegion,
        error: getErrorMessage(err),
        errorStack: getErrorStack(err),
      },
      startKey,
    );

    terminal.writeln(formatErrorMessage(`Failed with error.${getErrorMessage(err)}`));

    return null;
  }
};

/**
 * Ensures that the CloudShell provider is registered for the current subscription
 */
export const ensureCloudShellProviderRegistered = async (): Promise<void> => {
  const response: CloudShellProviderInfo = await verifyCloudShellProviderRegistration(userContext.subscriptionId);

  if (response.registrationState !== "Registered") {
    await registerCloudShellProvider(userContext.subscriptionId);
  }
};

/**
 * Determines the appropriate CloudShell region
 */
export const determineCloudShellRegion = (): string => {
  const defaultRegion =
    userContext.portalEnv === "fairfax" ? DEFAULT_FAIRFAX_CLOUDSHELL_REGION : DEFAULT_CLOUDSHELL_REGION;
  return getNormalizedRegion(userContext.databaseAccount?.location, defaultRegion);
};

/**
 * Provisions a CloudShell session
 */
export const provisionCloudShellSession = async (
  resolvedRegion: string,
  terminal: Terminal,
): Promise<{ socketUri?: string; provisionConsoleResponse?: ProvisionConsoleResponse; targetUri?: string }> => {
  // Apply user settings
  await putEphemeralUserSettings(userContext.subscriptionId, resolvedRegion);

  // Provision console
  let provisionConsoleResponse;
  let attemptCounter = 0;

  do {
    provisionConsoleResponse = await provisionConsole(resolvedRegion);
    attemptCounter++;

    if (provisionConsoleResponse.properties.provisioningState === "Failed") {
      break;
    }

    if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
      await wait(POLLING_INTERVAL_MS);
    }
  } while (provisionConsoleResponse.properties.provisioningState !== "Succeeded" && attemptCounter < MAX_RETRY_COUNT);

  if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
    throw new Error(`Provisioning failed: ${provisionConsoleResponse.properties.provisioningState}`);
  }

  // Connect terminal
  const connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, {
    rows: terminal.rows,
    cols: terminal.cols,
  });

  const targetUri = `${provisionConsoleResponse.properties.uri}/terminals?cols=${terminal.cols}&rows=${terminal.rows}&version=2019-01-01&shell=bash`;
  const termId = connectTerminalResponse.id;

  // Determine socket URI
  let socketUri = connectTerminalResponse.socketUri.replace(":443/", "");
  const targetUriBody = targetUri.replace("https://", "").split("?")[0];

  // This socket URI transformation logic handles different Azure service endpoint formats.
  // If the returned socketUri doesn't contain the expected host, we construct it manually.
  // This ensures compatibility across different Azure regions and deployment configurations.
  if (socketUri.indexOf(targetUriBody) === -1) {
    socketUri = `wss://${targetUriBody}/${termId}`;
  }

  // Special handling for ServiceBus-based endpoints which require a specific URI format
  // with the hierarchical connection ($hc) path segment for terminal connections
  if (targetUriBody.includes("servicebus")) {
    const targetUriBodyArr = targetUriBody.split("/");
    socketUri = `wss://${targetUriBodyArr[0]}/$hc/${targetUriBodyArr[1]}/terminals/${termId}`;
  }

  return { socketUri, provisionConsoleResponse, targetUri };
};

/**
 * Establishes a terminal connection via WebSocket
 */
export const establishTerminalConnection = async (
  terminal: Terminal,
  shellHandler: AbstractShellHandler,
  socketUri: string,
): Promise<WebSocket> => {
  let socket = new WebSocket(socketUri);

  // Get shell-specific initial commands
  const initCommands = shellHandler.getInitialCommands();

  // Configure the socket
  socket = await configureSocketConnection(socket, socketUri, terminal, initCommands, 0);

  const options = {
    startMarker: START_MARKER,
    shellHandler: shellHandler,
  };

  // Attach the terminal addon
  const attachAddon = new AttachAddon(socket, options);
  terminal.loadAddon(attachAddon);

  return socket;
};

/**
 * Configures a WebSocket connection for the terminal
 */
export const configureSocketConnection = async (
  socket: WebSocket,
  uri: string,
  terminal: Terminal,
  initCommands: string,
  socketRetryCount: number,
): Promise<WebSocket> => {
  sendTerminalStartupCommands(socket, initCommands);

  socket.onerror = async () => {
    if (socketRetryCount < MAX_RETRY_COUNT && socket.readyState !== WebSocket.CLOSED) {
      await configureSocketConnection(socket, uri, terminal, initCommands, socketRetryCount + 1);
    } else {
      socket.close();
    }
  };

  socket.onclose = () => {
    if (keepAliveID) {
      clearTimeout(keepAliveID);
      pingCount = 0;
    }
  };

  return socket;
};

export const sendTerminalStartupCommands = (socket: WebSocket, initCommands: string): void => {
  // ensures connections don't remain open indefinitely by implementing an automatic timeout after 120 minutes.
  const keepSocketAlive = (socket: WebSocket) => {
    if (socket.readyState === WebSocket.OPEN) {
      if (pingCount >= MAX_PING_COUNT) {
        socket.close();
      } else {
        pingCount++;
        // The code uses a recursive setTimeout pattern rather than setInterval,
        // which ensures each new ping only happens after the previous one completes
        // and naturally stops if the socket closes.
        keepAliveID = setTimeout(() => keepSocketAlive(socket), 1000);
      }
    }
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(initCommands);
    keepSocketAlive(socket);
  } else {
    socket.onopen = () => {
      socket.send(initCommands);
      keepSocketAlive(socket);
    };
  }
};
