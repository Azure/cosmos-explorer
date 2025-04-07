/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Core functionality for CloudShell terminal management
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import {
    authorizeSession,
    connectTerminal,
    provisionConsole,
    putEphemeralUserSettings,
    registerCloudShellProvider,
    verifyCloudShellProviderRegistration
} from "../Data/CloudShellApiClient";
import { getNormalizedRegion } from "../Data/RegionUtils";
import { ShellTypeHandler } from "../ShellTypes/ShellTypeFactory";
import { AttachAddon } from "../Utils/AttachAddOn";
import { wait } from "../Utils/CommonUtils";
import { terminalLog } from "../Utils/LogFormatter";

// Constants
const DEFAULT_CLOUDSHELL_REGION = "westus";
const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_COUNT = 10;
const MAX_PING_COUNT = 20 * 60; // 20 minutes (60 seconds/minute)

/**
 * Main function to start a CloudShell terminal
 */
export const startCloudShellTerminal = async (terminal: Terminal, shellType: TerminalKind) => {
  // Get the shell handler for this type
  const shellHandler = ShellTypeHandler.getHandler(shellType);
  
  terminal.writeln(terminalLog.header("Initializing Azure CloudShell"));
  await ensureCloudShellProviderRegistered(terminal);

  const { resolvedRegion, defaultCloudShellRegion } = determineCloudShellRegion(terminal);

  // Ask for user consent for region
  const consentGranted = await askForRegionConsent(terminal, resolvedRegion);
  if (!consentGranted) {
    return {}; // Exit if user declined
  }

  // Check network requirements for this shell type
  const networkConfig = await shellHandler.configureNetworkAccess(terminal, resolvedRegion);

  terminal.writeln("");
  // Provision CloudShell session
  terminal.writeln(terminalLog.cloudshell(`Provisioning Started....`));

  let sessionDetails: {
    socketUri?: string;
    provisionConsoleResponse?: any;
    targetUri?: string;
  };

  try {
    sessionDetails = await provisionCloudShellSession(resolvedRegion, terminal, networkConfig.vNetSettings, networkConfig.isAllPublicAccessEnabled);
  } catch (err) {
    terminal.writeln(terminalLog.error(err));
    terminal.writeln(terminalLog.error("Failed to provision in primary region"));
    terminal.writeln(terminalLog.warning(`Attempting with fallback region: ${defaultCloudShellRegion}`));

    sessionDetails = await provisionCloudShellSession(defaultCloudShellRegion, terminal, networkConfig.vNetSettings, networkConfig.isAllPublicAccessEnabled);
  }

  if (!sessionDetails.socketUri) {
    terminal.writeln(terminalLog.error('Unable to provision console. Please try again later.'));
    return {};
  }

  // Configure WebSocket connection with shell-specific commands
  const socket = await establishTerminalConnection(
    terminal,
    shellHandler,
    sessionDetails.socketUri,
    sessionDetails.provisionConsoleResponse,
    sessionDetails.targetUri
  );

  return socket;
};

/**
 * Ensures that the CloudShell provider is registered for the current subscription
 */
export const ensureCloudShellProviderRegistered = async (terminal: Terminal): Promise<void> => {
  try {
    terminal.writeln(terminalLog.info("Verifying provider registration..."));
    const response: any = await verifyCloudShellProviderRegistration(userContext.subscriptionId);

    if (response.registrationState !== "Registered") {
      terminal.writeln(terminalLog.warning("Registering CloudShell provider..."));
      await registerCloudShellProvider(userContext.subscriptionId);
      terminal.writeln(terminalLog.success("Provider registration successful"));
    }
  } catch (err) {
    terminal.writeln(terminalLog.error("Unable to verify provider registration"));
    throw err;
  }
};

/**
 * Determines the appropriate CloudShell region
 */
export const determineCloudShellRegion = (terminal: Terminal): { resolvedRegion: string; defaultCloudShellRegion: string } => {
  const region = userContext.databaseAccount?.location;
  const resolvedRegion = getNormalizedRegion(region, DEFAULT_CLOUDSHELL_REGION);

  return { resolvedRegion, defaultCloudShellRegion: DEFAULT_CLOUDSHELL_REGION };
};

/**
 * Asks the user for consent to use the specified CloudShell region
 */
export const askForRegionConsent = async (terminal: Terminal, resolvedRegion: string): Promise<boolean> => {
  terminal.writeln(terminalLog.header("CloudShell Region Confirmation"));
  terminal.writeln(terminalLog.info("The CloudShell container will be provisioned in a specific Azure region."));
  // Data residency and compliance information
  terminal.writeln(terminalLog.subheader("Important Information"));
  const dbRegion = userContext.databaseAccount?.location || "unknown";
  terminal.writeln(terminalLog.item("Database Region", dbRegion));
  terminal.writeln(terminalLog.item("CloudShell Container Region", resolvedRegion));

  terminal.writeln(terminalLog.subheader("What this means to you?"));
  terminal.writeln(terminalLog.item("Data Residency", "Commands and query results will be processed in this region"));
  terminal.writeln(terminalLog.item("Network", "Database connections will originate from this region"));

  // Consent question
  terminal.writeln("");
  terminal.writeln(terminalLog.prompt("Would you like to provision Azure CloudShell in the '" + resolvedRegion + "' region?"));
  terminal.writeln(terminalLog.prompt("Press 'Y' to continue or 'N' to cancel (Y/N)"));

  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln("");

      if (key.toLowerCase() === 'y') {
        terminal.writeln(terminalLog.success("Proceeding with CloudShell in " + resolvedRegion));
        terminal.writeln(terminalLog.separator());
        resolve(true);
      } else {
        terminal.writeln(terminalLog.error("CloudShell provisioning canceled"));
        setTimeout(() => terminal.dispose(), 2000);
        resolve(false);
      }
    });
  });
};

/**
 * Provisions a CloudShell session
 */
export const provisionCloudShellSession = async (
  resolvedRegion: string,
  terminal: Terminal,
  vNetSettings: object,
  isAllPublicAccessEnabled: boolean
): Promise<{ socketUri?: string; provisionConsoleResponse?: any; targetUri?: string }> => {
  return new Promise( async (resolve, reject) => {
    try {
      terminal.writeln(terminalLog.header("Configuring CloudShell Session"));
      // Check if vNetSettings is available and not empty
      const hasVNetSettings = vNetSettings && Object.keys(vNetSettings).length > 0;
      if (hasVNetSettings) {
        terminal.writeln(terminalLog.vnet("Enabling private network configuration"));
        displayNetworkSettings(terminal, vNetSettings, resolvedRegion);
      }
      else {
        terminal.writeln(terminalLog.warning("No VNet configuration provided"));
        terminal.writeln(terminalLog.warning("CloudShell will be provisioned with public network access"));

        if (!isAllPublicAccessEnabled) {
          terminal.writeln(terminalLog.error("Warning: Your database has network restrictions"));
          terminal.writeln(terminalLog.error("CloudShell may not be able to connect without proper VNet configuration"));
        }
      }
      terminal.writeln(terminalLog.warning("Any previous VNet settings will be overridden"));

       // Apply user settings
      await putEphemeralUserSettings(userContext.subscriptionId, resolvedRegion, vNetSettings);
      terminal.writeln(terminalLog.success("Session settings applied"));
      
      // Provision console
      let provisionConsoleResponse;
      let attemptCounter = 0;

      do {
        provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, resolvedRegion);
        terminal.writeln(terminalLog.progress("Provisioning", provisionConsoleResponse.properties.provisioningState));
        
        attemptCounter++;

        if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
          await wait(POLLING_INTERVAL_MS);
        }
      } while (provisionConsoleResponse.properties.provisioningState !== "Succeeded" && attemptCounter < 10);

      if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
        const errorMessage = `Provisioning failed: ${provisionConsoleResponse.properties.provisioningState}`;
        terminal.writeln(terminalLog.error(errorMessage));
        return reject(new Error(errorMessage));
      }
      
      // Connect terminal
      const connectTerminalResponse = await connectTerminal(
        provisionConsoleResponse.properties.uri,
        { rows: terminal.rows, cols: terminal.cols }
      );

      const targetUri = `${provisionConsoleResponse.properties.uri}/terminals?cols=${terminal.cols}&rows=${terminal.rows}&version=2019-01-01&shell=bash`;
      const termId = connectTerminalResponse.id;

      // Determine socket URI
      let socketUri = connectTerminalResponse.socketUri.replace(":443/", "");
      const targetUriBody = targetUri.replace('https://', '').split('?')[0];

      if (socketUri.indexOf(targetUriBody) === -1) {
        socketUri = `wss://${targetUriBody}/${termId}`;
      }

      if (targetUriBody.includes('servicebus')) {
        const targetUriBodyArr = targetUriBody.split('/');
        socketUri = `wss://${targetUriBodyArr[0]}/$hc/${targetUriBodyArr[1]}/terminals/${termId}`;
      }

      return resolve({ socketUri, provisionConsoleResponse, targetUri });
    } catch (err) {
      terminal.writeln(terminalLog.error(`Provisioning failed: ${err.message}`));
      return reject(err);
    }
  });
};

/**
 * Display VNet settings in the terminal
 */
const displayNetworkSettings = (terminal: Terminal, vNetSettings: any, resolvedRegion: string): void => {
  if (vNetSettings.networkProfileResourceId) {
    const profileName = vNetSettings.networkProfileResourceId.split('/').pop();
    terminal.writeln(terminalLog.item("Network Profile", profileName));
    
    if (vNetSettings.relayNamespaceResourceId) {
      const relayName = vNetSettings.relayNamespaceResourceId.split('/').pop();
      terminal.writeln(terminalLog.item("Relay Namespace", relayName));
    }
          
    terminal.writeln(terminalLog.item("Region", resolvedRegion));
    terminal.writeln(terminalLog.success("CloudShell will use this VNet to connect to your database"));
  }
};

/**
 * Establishes a terminal connection via WebSocket
 */
export const establishTerminalConnection = async (
  terminal: Terminal,
  shellHandler: any,
  socketUri: string,
  provisionConsoleResponse: any,
  targetUri: string
): Promise<WebSocket> => {
  let socket = new WebSocket(socketUri);

  // Get shell-specific initial commands 
  const initCommands = await shellHandler.getInitialCommands();

  // Configure the socket
  socket = configureSocketConnection(socket, socketUri, terminal, initCommands, 0);

  // Attach the terminal addon
  const attachAddon = new AttachAddon(socket);
  terminal.loadAddon(attachAddon);
  terminal.writeln(terminalLog.success("Connection established"));

  // Authorize the session
  try {
    const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
    const cookieToken = authorizeResponse.token;

    // Load auth token with a hidden image
    const img = document.createElement("img");
    img.src = `${targetUri}&token=${encodeURIComponent(cookieToken)}`;
    terminal.focus();
  } catch (err) {
    terminal.writeln(terminalLog.error("Authorization failed"));
    socket.close();
    throw err;
  }

  return socket;
};

/**
 * Configures a WebSocket connection for the terminal
 */
export const configureSocketConnection = (
  socket: WebSocket,
  uri: string,
  terminal: Terminal,
  initCommands: string,
  socketRetryCount: number
): WebSocket => {
  let jsonData = '';
  let keepAliveID: NodeJS.Timeout = null;
  let pingCount = 0;

  sendTerminalStartupCommands(socket, initCommands);

  socket.onclose = () => {
    if (keepAliveID) {
      clearTimeout(keepAliveID);
      pingCount = 0;
    }
    terminal.writeln(terminalLog.warning("Session terminated. Refresh the page to start a new session."));
  };

  socket.onerror = () => {
    if (socketRetryCount < MAX_RETRY_COUNT && socket.readyState !== WebSocket.CLOSED) {
      configureSocketConnection(socket, uri, terminal, initCommands, socketRetryCount + 1);
    } else {
      socket.close();
    }
  };

  socket.onmessage = (event: MessageEvent<string>) => {
    pingCount = 0; // Reset ping count on message receipt

    let eventData = '';
    if (typeof event.data === "object") {
      try {
        const enc = new TextDecoder("utf-8");
        eventData = enc.decode(event.data as any);
      } catch (e) {
        // Not an array buffer, ignore
      }
    }

    if (typeof event.data === 'string') {
      eventData = event.data;
    }

    // Process event data
    if (eventData.includes("ie_us") && eventData.includes("ie_ue")) {
      const statusData = eventData.split('ie_us')[1].split('ie_ue')[0];
      console.log(statusData);
    } else if (eventData.includes("ie_us")) {
      jsonData += eventData.split('ie_us')[1];
    } else if (eventData.includes("ie_ue")) {
      jsonData += eventData.split('ie_ue')[0];
      console.log(jsonData);
      jsonData = '';
    } else if (jsonData.length > 0) {
      jsonData += eventData;
    }
  };

  return socket;
};

/**
 * Sends startup commands to the terminal
 */
export const sendTerminalStartupCommands = (socket: WebSocket, initCommands: string): void => {
  let keepAliveID: NodeJS.Timeout = null;
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
            socket.send('');
            pingCount++;
            keepAliveID = setTimeout(() => keepSocketAlive(socket), 1000);
          }
        }
      };

      keepSocketAlive(socket);
    };
  }
};
