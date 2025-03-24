/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { RelayNamespaceResponse, VnetModel, VnetSettings } from "Explorer/Tabs/CloudShellTab/DataModels";
import { listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { Terminal } from "xterm";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import { AttachAddon } from "./AttachAddOn";
import { getCommands } from "./Commands";
import { authorizeSession, connectTerminal, getARMInfo, getNormalizedRegion, getUserSettings, provisionConsole, putEphemeralUserSettings, registerCloudShellProvider, verifyCloudShellProviderRegistration } from "./Data";
import { LogError, LogInfo } from "./LogFormatter";

export const startCloudShellTerminal = async (terminal: Terminal, shellType: TerminalKind) => {

    // validate that the subscription id is registered in the CloudShell namespace
    terminal.writeln("");
    try {
        terminal.writeln("\x1B[34mVerifying CloudShell provider registration...\x1B[0m");
        const response: any = await verifyCloudShellProviderRegistration(userContext.subscriptionId);
        if (response.registrationState !== "Registered") {
            terminal.writeln("\x1B[33mCloudShell provider registration is not found. Registering now...\x1B[0m");
            await registerCloudShellProvider(userContext.subscriptionId);
            terminal.writeln("\x1B[32mCloudShell provider registration completed successfully.\x1B[0m");
        }
    } catch (err) {
        terminal.writeln("\x1B[31mError: Unable to verify CloudShell provider registration.\x1B[0m");
        throw err;
    }

    terminal.writeln("");
    terminal.writeln("\x1B[34mFetching user settings...\x1B[0m");
    let settings;
    try {
        settings = await getUserSettings();
    }
    catch (err) {
        terminal.writeln("\x1B[33mNo user settings found. Proceeding with default settings.\x1B[0m");   
    }

    let vNetSettings: VnetSettings;
    if(settings?.properties?.vnetSettings && Object.keys(settings?.properties?.vnetSettings).length > 0) {

        terminal.writeln("\x1B[1mUsing existing VNet settings:\x1B[0m");
        terminal.writeln("  - Network Profile Resource ID: \x1B[32m" + settings.properties.vnetSettings.networkProfileResourceId + "\x1B[0m");
        terminal.writeln("  - Relay Namespace Resource ID: \x1B[32m" + settings.properties.vnetSettings.relayNamespaceResourceId + "\x1B[0m");
        terminal.writeln("  - VNet Location: \x1B[32m" + settings.properties.vnetSettings.location + "\x1B[0m");

        vNetSettings = {
            networkProfileResourceId: settings.properties.vnetSettings.networkProfileResourceId,
            relayNamespaceResourceId: settings.properties.vnetSettings.relayNamespaceResourceId,
            location: settings.properties.vnetSettings.location
        };
    }
    else
    {
        terminal.writeln("\x1B[33mNo existing VNet settings found. Proceeding with default settings.\x1B[0m");
    }

    terminal.writeln(""); 

    terminal.writeln("\x1B[1mSelect an option to continue:\x1B[0m");
    terminal.writeln("\x1B[33m1 - Use current/default VNet settings\x1B[0m");
    terminal.writeln("\x1B[33m2 - Configure a new VNet for CloudShell\x1B[0m");
    terminal.writeln("\x1B[33m3 - Reset CloudShell VNet settings to default\x1B[0m");
    terminal.writeln("\x1B[34mFor details on configuring VNet for CloudShell, visit: https://aka.ms/cloudshellvnetsetup\x1B[0m");

    terminal.focus();
    
    let isDefaultSetting = false;
    const handleKeyPress = terminal.onKey(async ({ key }: { key: string }) => {
        terminal.writeln("")
        if (key === "1") {
            terminal.writeln("\x1B[34mYou selected option 1: Proceeding with current/default settings.\x1B[0m");
            handleKeyPress.dispose();
        }
       else if (key === "2") {
            terminal.writeln("\x1B[34mYou selected option 2: Please provide the following details.\x1B[0m");
            handleKeyPress.dispose();

            const subscriptionId = await askQuestion(terminal, "Enter VNet Subscription ID");
            const resourceGroup = await askQuestion(terminal, "Enter VNet Resource Group");
            const vNetName = await askQuestion(terminal, "Enter VNet Name");

            terminal.writeln("\x1B[34mFetching VNet details...\x1B[0m");
            const vNetConfig = await getARMInfo<VnetModel>(`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/${vNetName}`);
            
            terminal.writeln("  - VNet Location: \x1B[32m" + vNetConfig.location + "\x1B[0m");
            terminal.writeln("  - Available Network Profiles:");
            const ipConfigurationProfiles = vNetConfig.properties.subnets.reduce<{ id: string }[]>(
                (acc, subnet) => acc.concat(subnet.properties.ipConfigurationProfiles || []),
                []);
            for (let i = 0; i < ipConfigurationProfiles.length; i++) {
                const match = ipConfigurationProfiles[i].id.match(/\/networkProfiles\/([^/]+)/);
                const result = match ? `${match[1]}` : null;
                terminal.writeln("    - \x1B[32m" + result + "\x1B[0m");
            }  
            
            const networkProfile = await askQuestion(terminal, "Network Profile to use");

            const relays = await getARMInfo<RelayNamespaceResponse>(
                `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Relay/namespaces`,
                "2024-01-01");
            terminal.writeln("  - Available Network Relays:");
            for (let i = 0; i < relays.value.length; i++) {
                terminal.writeln("    - \x1B[32m" + relays.value[i].name + "\x1B[0m");
            }  

            const relayName = await askQuestion(terminal, "Network Relay to use:");

            const networkProfileResourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkProfiles/${networkProfile.replace(/[\n\r]/g, "")}`;
            const relayResourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Relay/namespaces/${relayName.replace(/[\n\r]/g, "")}`;

            vNetSettings = {
                networkProfileResourceId: networkProfileResourceId,
                relayNamespaceResourceId: relayResourceId,
                location: vNetConfig.location
            };
        }
        else if (key === "3") {
            terminal.writeln("\x1B[34mYou selected option 3: Resetting VNet settings to default.\x1B[0m");

            vNetSettings = {};
            handleKeyPress.dispose();
        }
        else {
            terminal.writeln("\x1B[31mInvalid selection. Only options 1, 2, and 3 are allowed. Exiting...\x1B[0m");
            setTimeout(() => terminal.dispose(), 2000); // Close terminal after 2 sec
            handleKeyPress.dispose();
            return;
        }

        terminal.writeln("\x1B[34mDetermining CloudShell region...\x1B[0m");
        const region = vNetSettings?.location ?? userContext.databaseAccount?.location;
        terminal.writeln("  - Identified Database Account Region: \x1B[32m" + region + "\x1B[0m");

        const defaultCloudShellRegion = "westus";
        const resolvedRegion = getNormalizedRegion(region, defaultCloudShellRegion);
        
        terminal.writeln("\x1B[33mAttempting to provision CloudShell in region: \x1B[1m" + resolvedRegion + "\x1B[0m");

        try {
            terminal.writeln("\x1B[34mProvisioning CloudShell session...\x1B[0m");
            var { socketUri, provisionConsoleResponse, targetUri } = await provisionCloudShellSession(resolvedRegion, terminal, vNetSettings);
        }
        catch (err) {
            terminal.writeln(LogError(err));   
            terminal.writeln("\x1B[31mError: Unable to provision CloudShell in the requested region.\x1B[0m");
            terminal.writeln("\x1B[33mFalling back to default region: " + defaultCloudShellRegion + "\x1B[0m");
            terminal.writeln("\x1B[34mAttempting to provision CloudShell in the default region...\x1B[0m");

            var { socketUri, provisionConsoleResponse, targetUri } = await provisionCloudShellSession(defaultCloudShellRegion, terminal, vNetSettings);     
        }
        
        if(!socketUri) {
            terminal.writeln(LogError('Unable to provision console. Close and Open the terminal again to retry.'));
            return{};
        }
    
        let socket = new WebSocket(socketUri);
    
        const dbName = userContext.databaseAccount.name;
        let keys;
        if (dbName)
        {
            keys =  await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
        }
        
        const initCommands = getCommands(shellType, keys?.primaryMasterKey);
        socket = configureSocket(socket, socketUri, terminal, initCommands, 0);
    
        const attachAddon = new AttachAddon(socket);
        terminal.loadAddon(attachAddon);
    
        // authorize the session
        try {
            terminal.writeln("\x1B[34mAuthorizing CloudShell session...\x1B[0m");

            const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
            const cookieToken = authorizeResponse.token;
            const a = document.createElement("img");
            a.src = targetUri + "&token=" + encodeURIComponent(cookieToken);
            terminal.writeln("\x1B[32mAuthorization successful. Establishing connection...\x1B[0m");
        } catch (err) {
            terminal.writeln("\x1B[31mError: Unable to authorize CloudShell session.\x1B[0m");
            socket.close();
            throw err;
        }
    
        terminal.writeln(LogInfo("Connection Successful!!!"));
        terminal.focus();
    
        return socket;
    });
}


const askQuestion = (terminal: any, question: string) => {
    return new Promise<string>((resolve) => {
        const prompt = `\x1B[1;34m${question}: \x1B[0m`; 
        terminal.writeln(prompt);
        terminal.focus();
        let response = "";

        const dataListener = terminal.onData((data: string) => {
            if (data === "\r") { // Enter key pressed
                terminal.writeln(""); // Move to a new line
                dataListener.dispose();
                return resolve(response.trim());
            } else if (data === "\u007F" || data === "\b") { // Handle backspace
                if (response.length > 0) {
                    response = response.slice(0, -1);
                    terminal.write("\x1B[D \x1B[D");// Move cursor back, clear character
                }
            }  else if (data.charCodeAt(0) >= 32) { // Ignore control characters
                response += data;
                terminal.write(data); // Display typed characters
            }
        });

        // Prevent cursor movement beyond the prompt
        terminal.onKey(({ domEvent} : { domEvent: KeyboardEvent }) => { 
            if (domEvent.key === "ArrowLeft" && response.length === 0) {
                domEvent.preventDefault(); // Stop moving left beyond the question
            }
        });
    });
  };

let keepAliveID: NodeJS.Timeout = null;
let pingCount = 0;

export const configureSocket = (socket: WebSocket,  uri: string, terminal: any, initCommands: string, socketRetryCount: number) => {
    let jsonData = '';

    sendStartupCommands(socket, initCommands);

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

const sendStartupCommands = (socket: WebSocket, initCommands: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(initCommands); // Example startup command
    } else {
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
    }
};

const provisionCloudShellSession = async(
    resolvedRegion: string, 
    terminal: Terminal,
    vNetSettings: object
): Promise<{ socketUri?: string; provisionConsoleResponse?: any; targetUri?: string }> => {
    return new Promise((resolve, reject) => {
        terminal.writeln("");
        // Show consent message inside the terminal
        terminal.writeln(`\x1B[1;33m⚠️ CloudShell is not available in your database account region.\x1B[0m`);
        terminal.writeln(`\x1B[1;33mWould you like to continue with CloudShell in ${resolvedRegion} instead?\x1B[0m`);
        terminal.writeln("\x1B[1;37mPress 'Y' to proceed or 'N' to cancel.\x1B[0m");
        
        terminal.focus();
        // Listen for user input
        const handleKeyPress = terminal.onKey(async ({ key }: { key: string }) => {
            // Remove the event listener after first execution
            handleKeyPress.dispose();

            if (key.toLowerCase() === "y") {
                terminal.writeln("\x1B[1;32m✔ Consent received. Requesting CloudShell...\x1B[0m");
                terminal.writeln("");
                terminal.writeln(LogInfo('Applying User Settings...'));
                try {
                    await putEphemeralUserSettings(userContext.subscriptionId, resolvedRegion, vNetSettings);
                } catch (err) {
                    terminal.writeln(LogError('Unable to update user settings to ephemeral session.'));
                    return reject(err);
                }

                // trigger callback to provision console internal
                let provisionConsoleResponse;
                try {
                    provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, resolvedRegion);
                } catch (err) {
                    terminal.writeln(LogError('Unable to provision console.'));
                    return reject(err);
                }

                // Add check for provisioning state
                if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
                    terminal.writeln(LogError("Failed to provision console."));
                    return reject(new Error("Failed to provision console."));
                }
            
                terminal.writeln("\x1B[34mConnecting to CloudShell Terminal...\x1B[0m");
                // connect the terminal
                let connectTerminalResponse;
                try {
                    connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, { rows: terminal.rows, cols: terminal.cols });
                } catch (err) {
                    terminal.writeln(LogError(`Unable to connect terminal. ${err}`));
                    return reject(err);
                }
            
                const targetUri = provisionConsoleResponse.properties.uri + `/terminals?cols=${terminal.cols}&rows=${terminal.rows}&version=2019-01-01&shell=bash`;
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

                terminal.writeln("\x1B[1;31mConsent denied. Exiting...\x1B[0m");
                setTimeout(() => terminal.dispose(), 2000); // Close terminal after 2 sec
                return resolve({});
            }
        });
    }); 
};
