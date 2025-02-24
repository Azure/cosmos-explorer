import { Terminal } from "xterm";
import { userContext } from "../../../UserContext";
import { authorizeSession, connectTerminal, getUserRegion, getUserSettings, provisionConsole, putEphemeralUserSettings, registerCloudShellProvider, validateUserSettings, verifyCloudshellProviderRegistration } from "./Data";

export const startCloudShellterminal = async (xterminal: Terminal, intervalsToClearRef: any, authorizationToken: any) => {

    const tokenInterval = setInterval(async () => {
        authorizationToken
    }, 1000 * 60 * 10);

    const intervalsToClear = intervalsToClearRef.current ?? [];
    intervalsToClear.push(tokenInterval);

    // validate that the subscription id is registered in the Cloudshell namespace
    try {
      const response: any = await verifyCloudshellProviderRegistration(userContext.subscriptionId);
      if (response.registrationState !== "Registered") {
          await registerCloudShellProvider(userContext.subscriptionId);
      }
    } catch (err) {
        xterminal.writeln('');
        xterminal.writeln('Unable to verify cloudshell provider registration.');
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        throw err;
    }

    const region = await getUserRegion(userContext.subscriptionId).then((res) => {
      const reqId = (res.headers as any).get("x-ms-routing-request-id");
      const location = reqId?.split(":")?.[0]?.toLowerCase() ?? "";
      const validRegions = new Set(["westus", "southcentralus", "eastus", "northeurope", "westeurope", "centralindia", "southeastasia", "westcentralus", "eastus2euap", "centraluseuap"]);
      if (validRegions.has(location.toLowerCase())) {
          return location;
      }
      if (location === "centralus") {
          return "centraluseuap";
      }
      if (location === "eastus2") {
          return "eastus2euap";
      }
      return "westus";
    }).catch((err) => {
      xterminal.writeln('');
      xterminal.writeln('Unable to get user region.');
      return "westus";
    });
       
    xterminal.writeln('Requested Region ' + region);
    
    try {
      // do not use the subscription from the preferred settings use the one from the context
      await putEphemeralUserSettings(userContext.subscriptionId, region);
    } catch (err) {
      xterminal.writeln('Unable to update user settings to ephemeral session.');
      throw err;
    }

    // verify user settings after they have been updated to ephemeral
    try {
        const userSettings = await getUserSettings();
        const isValidUserSettings = validateUserSettings(userSettings);
        if (!isValidUserSettings) {
            throw new Error("Invalid user settings detected for ephemeral session.");
        }
    } catch (err) {
      xterminal.writeln('Unable to verify user settings for ephemeral session.');
      throw err;
    }

    // trigger callback to provision console internal
    let provisionConsoleResponse;
    try {
        provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, region);
       // statusPaneUpdateCommands.setTerminalUri(provisionConsoleResponse.properties.uri);
    } catch (err) {
      xterminal.writeln('Unable to provision console.');
      throw err;
    }

    if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
        xterminal.writeln("Failed to provision console.");
        throw new Error("Failed to provision console.");
    }

    xterminal.writeln("Connecting to cloudshell...");
    xterminal.writeln("Please wait...");
    // connect the terminal
    let connectTerminalResponse;
    try {
        connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, { rows: xterminal.rows, cols: xterminal.cols });
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to connect terminal.');
      throw err;
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

    // // provision appropriate first party permissions to cloudshell instance
    // await postTokens(provisionConsoleResponse.properties.uri, authorizationToken).catch((err) => {
    //     xterminal.writeln('Unable to provision first party permissions to cloudshell instance.');
    //     intervalsToClear.forEach((val) => window.clearInterval(+val));
    //     throw err;
    // });

    const socket = new WebSocket(socketUri);

    configureSocket(socket, socketUri, xterminal, intervalsToClear, 0);

    // authorize the session
    try {
        const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
        const cookieToken = authorizeResponse.token;
        const a = document.createElement("img");
        a.src = targetUri + "&token=" + encodeURIComponent(cookieToken);
    } catch (err) {
        xterminal.writeln('Unable to authroize the session');
        socket.close();
        throw err;
    }

    xterminal.writeln("Connected to cloudshell.");
    xterminal.focus();

    return socket;
}

let keepAliveID: NodeJS.Timeout = null;
let pingCount = 0;

export const configureSocket = (socket: WebSocket,  uri: string, terminal: any, intervals: NodeJS.Timer[], socketRetryCount: number) => {
    let jsonData = '';
    socket.onopen = () => {
        terminal.writeln("Socket Opened");
        const initializeCommand =
            `curl -s https://ipinfo.io \n` +
            `curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz \n` +
            `tar -xvzf mongosh-2.3.8-linux-x64.tgz \n` +
            `mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/ \n` +
            `echo 'export PATH=$PATH:$HOME/mongosh/bin' >> ~/.bashrc \n` +
            `source ~/.bashrc \n` +
            `mongosh --version \n`;

        terminal.writeln(initializeCommand);
        socket.send(initializeCommand);

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
        terminal.writeln("Socket Closed");
        if (keepAliveID) {
            clearTimeout(keepAliveID);
            pingCount = 0;
        }
        intervals.forEach((val) => {
            window.clearInterval(+val);
        });

        terminal.writeln("Session terminated. Please refresh the page to start a new session.");
    };

    socket.onerror = () => {
        terminal.writeln("terminal reconnected");
        if (socketRetryCount < 10 && socket.readyState !== WebSocket.CLOSED) {
            configureSocket(socket, uri, terminal, intervals, socketRetryCount + 1);
        } else {
            // log an error indicating socket connection failed
            terminal.writeln("Socket connection closed");
            // close the socket
            socket.close();
        }
    };

    socket.onmessage = (event: MessageEvent<string>) => {
        terminal.writeln("Socket onMessage");
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

            terminal.write(eventData);
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
