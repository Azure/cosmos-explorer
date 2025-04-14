/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Core functionality for CloudShell terminal management
 */

import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { Terminal } from "xterm";
import { Areas } from "../../../Common/Constants";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import {
  authorizeSession,
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
const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_COUNT = 10;
const MAX_PING_COUNT = 20 * 60; // 20 minutes (60 seconds/minute)

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
    // Ask for user consent for region
    const consentGranted = await askConfirmation(
      terminal,
      formatWarningMessage(
        "This shell might be in a different region than the database region. Do you want to proceed?",
      ),
    );

    // Track user decision
    TelemetryProcessor.trace(
      Action.CloudShellUserConsent,
      consentGranted ? ActionModifiers.Success : ActionModifiers.Cancel,
      { dataExplorerArea: Areas.CloudShell },
    );

    if (!consentGranted) {
      return null; // Exit if user declined
    }

    terminal.writeln(formatInfoMessage("Connecting to CloudShell....."));

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
    const socket = await establishTerminalConnection(
      terminal,
      shellHandler,
      sessionDetails.socketUri,
      sessionDetails.provisionConsoleResponse,
      sessionDetails.targetUri,
    );

    TelemetryProcessor.traceSuccess(
      Action.CloudShellTerminalSession,
      {
        shellType: TerminalKind[shellType],
        dataExplorerArea: Areas.CloudShell,
        region: resolvedRegion,
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
  return getNormalizedRegion(userContext.databaseAccount?.location, DEFAULT_CLOUDSHELL_REGION);
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

    if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
      await wait(POLLING_INTERVAL_MS);
    }
  } while (provisionConsoleResponse.properties.provisioningState !== "Succeeded" && attemptCounter < 10);

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

  if (socketUri.indexOf(targetUriBody) === -1) {
    socketUri = `wss://${targetUriBody}/${termId}`;
  }

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
  provisionConsoleResponse: ProvisionConsoleResponse,
  targetUri: string,
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

  // Authorize the session
  try {
    const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
    const cookieToken = authorizeResponse.token;

    // Load auth token with a hidden image
    const img = document.createElement("img");
    img.src = `${targetUri}&token=${encodeURIComponent(cookieToken)}`;
    terminal.focus();
  } catch (err) {
    socket.close();
    throw err;
  }

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

  return socket;
};

export const sendTerminalStartupCommands = (socket: WebSocket, initCommands: string): void => {
  let pingCount = 0;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(initCommands);
  } else {
    socket.onopen = () => {
      socket.send(initCommands);

      const keepSocketAlive = (socket: WebSocket) => {
        if (socket.readyState === WebSocket.OPEN) {
          if (pingCount >= MAX_PING_COUNT) {
            socket.close();
          } else {
            socket.send("");
            pingCount++;
          }
        }
      };

      keepSocketAlive(socket);
    };
  }
};
