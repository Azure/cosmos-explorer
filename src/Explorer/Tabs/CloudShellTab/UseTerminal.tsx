/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import { AttachAddon } from "./AttachAddOn";
import { getCommands } from "./Commands";
import { authorizeSession, connectTerminal, getNormalizedRegion, getUserSettings, provisionConsole, putEphemeralUserSettings, registerCloudShellProvider, validateUserSettings, verifyCloudshellProviderRegistration } from "./Data";
import { LogError, LogInfo } from "./LogFormatter";
import { listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";

export const startCloudShellterminal = async (xterminal: Terminal, shellType: TerminalKind) => {

    // validate that the subscription id is registered in the Cloudshell namespace
    try {
      const response: any = await verifyCloudshellProviderRegistration(userContext.subscriptionId);
      if (response.registrationState !== "Registered") {
          await registerCloudShellProvider(userContext.subscriptionId);
      }
    } catch (err) {
        xterminal.writeln(LogError('Unable to verify cloudshell provider registration.'));
        throw err;
    }

    const region = userContext.databaseAccount?.location;
    xterminal.writeln(LogInfo(`Database Acount Region identified as '${region}'`));

    const defaultCloudshellRegion = "westus";
    const resolvedRegion = getNormalizedRegion(region, defaultCloudshellRegion);
    
    xterminal.writeln(LogInfo(`Requesting Cloudshell instance at '${resolvedRegion}'`));
    
    try {
        var { socketUri, provisionConsoleResponse, targetUri } = await provisionCloudShellSession(resolvedRegion, xterminal);
    }
    catch (err) {
        xterminal.writeln(LogError(err));   
        xterminal.writeln(LogError(`Unable to provision console in request region, Falling back to default region i.e. ${defaultCloudshellRegion}`));   
        var { socketUri, provisionConsoleResponse, targetUri } = await provisionCloudShellSession(defaultCloudshellRegion, xterminal);     
    }
    
    if(!socketUri) {
        xterminal.writeln(LogError('Unable to provision console. Close and Open the terminal again to retry.'));
        return{};
    }

    let socket = new WebSocket(socketUri);

    let keys =  await listKeys(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);

    const initCommands = getCommands(shellType, keys.primaryMasterKey);
    socket = configureSocket(socket, socketUri, xterminal, initCommands, 0);

    const attachAddon = new AttachAddon(socket);
    xterminal.loadAddon(attachAddon);

    // authorize the session
    try {
        const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
        const cookieToken = authorizeResponse.token;
        const a = document.createElement("img");
        a.src = targetUri + "&token=" + encodeURIComponent(cookieToken);
    } catch (err) {
        xterminal.writeln(LogError('Unable to authroize the session'));
        socket.close();
        throw err;
    }

    xterminal.writeln(LogInfo("Connection Successful!!!"));
    xterminal.focus();

    return socket;
}

let keepAliveID: NodeJS.Timeout = null;
let pingCount = 0;

export const configureSocket = (socket: WebSocket,  uri: string, terminal: any, initCommands: string, socketRetryCount: number) => {
    let jsonData = '';
    socket.onopen = () => {
        socket.send(initCommands);

        const keepSocketAlive = (socket: WebSocket) => {
            if (socket.readyState === WebSocket.OPEN) {
                if ((pingCount / 60) >= 20) {
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

    socket.onclose = () => {
        if (keepAliveID) {
            clearTimeout(keepAliveID);
            pingCount = 0;
        }

        terminal.writeln("Session terminated. Please refresh the page to start a new session.");
    };

    socket.onerror = () => {
        if (socketRetryCount < 10 && socket.readyState !== WebSocket.CLOSED) {
            configureSocket(socket, uri, terminal, initCommands, socketRetryCount + 1);
        } else {
            // close the socket
            socket.close();
        }
    };

    socket.onmessage = (event: MessageEvent<string>) => {
        // if we are sending and receiving messages the terminal is not idle set ping count to 0
        pingCount = 0;

        // check if we are dealing with array buffer or string
        let eventData = '';
        if (typeof event.data === "object") {
            try {
                const enc = new TextDecoder("utf-8");
                eventData = enc.decode(event.data as any);
            } catch (e) {
                // not array buffer
            }
        }
        if (typeof event.data === 'string') {
            eventData = event.data;
        }

        // process as one line or process as multiline
        if (eventData.includes("ie_us") && eventData.includes("ie_ue")) {
            // process as one line
            const statusData = eventData.split('ie_us')[1].split('ie_ue')[0];
            console.log(statusData);
        } else if (eventData.includes("ie_us")) {
            // check for start
            jsonData += eventData.split('ie_us')[1];
        } else if (eventData.includes("ie_ue")) {
            // check for end and process the command
            jsonData += eventData.split('ie_ue')[0];
            console.log(jsonData);
            jsonData = '';
        } else if (jsonData.length > 0) {
            // check if the line is all data then just concatenate
            jsonData += eventData;
        }
    };

    return socket;
};

const provisionCloudShellSession = async(
    resolvedRegion: string, 
    xterminal: Terminal
): Promise<{ socketUri?: string; provisionConsoleResponse?: any; targetUri?: string }> => {
    return new Promise((resolve, reject) => {
        // Show consent message inside the terminal
        xterminal.writeln(`\x1B[1;33m⚠️  Are you agreeing to continue with CloudShell terminal at ${resolvedRegion}.\x1B[0m`);
        xterminal.writeln("\x1B[1;37mPress 'Y' to continue or 'N' to exit.\x1B[0m");

        xterminal.focus();
        // Listen for user input
        const handleKeyPress = xterminal.onKey(async ({ key }: { key: string }) => {
            // Remove the event listener after first execution
            handleKeyPress.dispose();

            if (key.toLowerCase() === "y") {
                xterminal.writeln("\x1B[1;32mConsent given. Requesting CloudShell. !\x1B[0m");

                try {
                    await putEphemeralUserSettings(userContext.subscriptionId, resolvedRegion);
                } catch (err) {
                    xterminal.writeln(LogError('Unable to update user settings to ephemeral session.'));
                    return reject(err);
                }
            
                // verify user settings after they have been updated to ephemeral
                try {
                    const userSettings = await getUserSettings();
                    const isValidUserSettings = validateUserSettings(userSettings);
                    if (!isValidUserSettings) {
                        throw new Error("Invalid user settings detected for ephemeral session.");
                    }
                } catch (err) {
                    xterminal.writeln(LogError('Unable to verify user settings for ephemeral session.'));
                    return reject(err);
                }
            
                // trigger callback to provision console internal
                let provisionConsoleResponse;
                try {
                    provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, resolvedRegion);
                } catch (err) {
                    xterminal.writeln(LogError('Unable to provision console.\n\r'));
                    return reject(err);
                }
            
                if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
                    xterminal.writeln(LogError("Failed to provision console.\n\r"));
                    return reject(new Error("Failed to provision console."));
                }
            
                xterminal.writeln(LogInfo("Connecting to Cloudshell Terminal...\n\r"));
                // connect the terminal
                let connectTerminalResponse;
                try {
                    connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, { rows: xterminal.rows, cols: xterminal.cols });
                } catch (err) {
                    xterminal.writeln('');
                    xterminal.writeln(LogError('Unable to connect terminal.'));
                    return reject(err);
                }
            
                const targetUri = provisionConsoleResponse.properties.uri + `/terminals?cols=${xterminal.cols}&rows=${xterminal.rows}&version=2019-01-01&shell=bash`;
                const termId = connectTerminalResponse.id;
            
                let socketUri = connectTerminalResponse.socketUri.replace(":443/", "");
                const targetUriBody = targetUri.replace('https://', '').split('?')[0];
                if (socketUri.indexOf(targetUriBody) === -1) {
                    socketUri = 'wss://' + targetUriBody + '/' + termId;
                }
                if (targetUriBody.includes('servicebus')) {
                    const targetUriBodyArr = targetUriBody.split('/');
                    socketUri = 'wss://' + targetUriBodyArr[0] + '/$hc/' + targetUriBodyArr[1] + '/terminals/' + termId;
                }
                return resolve({ socketUri, provisionConsoleResponse, targetUri });

            } else if (key.toLowerCase() === "n") {

            xterminal.writeln("\x1B[1;31m Consent denied. Exiting...\x1B[0m");
                setTimeout(() => xterminal.dispose(), 2000); // Close terminal after 2 sec
                return resolve({});
            }
        });
    }); 
};
