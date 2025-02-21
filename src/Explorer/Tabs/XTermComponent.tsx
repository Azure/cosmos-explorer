import React, { useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";

const XTermComponent: React.FC = () => {
    const terminalRef = useRef(null); // Reference for terminal container
    const xtermRef = useRef(null);    // Reference for XTerm instance
    const socketRef = useRef(null);   // Reference for WebSocket
    const intervalsToClearRef = useRef<NodeJS.Timer[]>([]);

    useEffect(() => {
         // Initialize XTerm instance
         const term = new Terminal({
            cursorBlink: true, 
            fontSize: 14,
            theme: { background: "#1d1f21", foreground: "#c5c8c6" },
        });

        // Attach terminal to the DOM
        if (terminalRef.current) {
            term.open(terminalRef.current);
            xtermRef.current = term;
        }

        term.writeln("Hello, World!");

        const authorizationHeader = getAuthorizationHeader()
        socketRef.current = startCloudShellterminal(term, intervalsToClearRef, authorizationHeader.token);
    
        term.onData((data) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(data);
            }
        });

        // Cleanup function to close WebSocket and dispose terminal
        return () => {
            if (socketRef.current) {
                socketRef.current.close(); // Close WebSocket connection
            }
            term.dispose(); // Clean up XTerm instance
        };
        
    }, []);

    return <div ref={terminalRef} style={{ width: "100%", height: "500px" }} />;
};

const startCloudShellterminal = async (xterminal: Terminal, intervalsToClearRef: any, authorizationToken: any) => {
    
    // const allowedParentFrameAuthorities = ["localhost:1234", "localhost:3000", "portal.azure.com", "portal.azure.us", "rc.portal.azure.com", "ms.portal.azure.com", "canary.portal.azure.com", "canary-ms.portal.azure.com", "docs.microsoft.com", "review.docs.microsoft.com", "ppe.docs.microsoft.com", "ux.console.azure.us", "admin-local.teams.microsoft.net", "admin-ignite.microsoft.com", "wusportalprv.office.com", "portal-sdf.office.com", "ncuportalprv.office.com", "admin.microsoft.com", "portal.microsoft.com", "portal.office.com", "admin.microsoft365.com", "admin-sdf.exchange.microsoft.com", "admin.exchange.microsoft.com", "cloudconsole-ux-prod-usnatwest.appservice.eaglex.ic.gov", "cloudconsole-ux-prod-usnateast.appservice.eaglex.ic.gov", "portal.azure.eaglex.ic.gov", "cloudconsole-ux-prod-ussecwest.appservice.microsoft.scloud", "cloudconsole-ux-prod-usseceast.appservice.microsoft.scloud", "portal.azure.microsoft.scloud", "admin-local.teams.microsoft.net", "admin-dev.teams.microsoft.net", "admin-int.teams.microsoft.net", "admin.teams.microsoft.com", "preview.portal.azure.com", "learn.microsoft.com", "review.learn.microsoft.com", "ppe.learn.microsoft.com", "dev.learn.microsoft.com"];
    // const trustedParentOrigin = getTrustedParentOrigin();
    // let trustedAuthority = (trustedParentOrigin.split("//")[1] || "").toLowerCase();
    // const isTrustedOrigin = allowedParentFrameAuthorities.some(origin => origin === trustedAuthority);

    // if (!isTrustedOrigin) {
    //     const errorMessage = "The origin '" + trustedParentOrigin + "' is not trusted.";
    //     xterminal.writeln('');
    //     xterminal.writeln(errorMessage);
    //     throw new Error(errorMessage);
    // }

    // trustedAuthority = (trustedParentOrigin.indexOf("https") === 0 ? "https://" : "http://") + trustedAuthority;

    const tokenInterval = setInterval(async () => {
        authorizationToken
    }, 1000 * 60 * 10);

    const intervalsToClear = intervalsToClearRef.current ?? [];
    intervalsToClear.push(tokenInterval);

    // validate that the subscription id is registered in the Cloudshell namespace
    try {
      const response: any = await verifyCloudshellProviderRegistration(userContext.subscriptionId, authorizationToken);
      if (response.registrationState !== "Registered") {
          await registerCloudShellProvider(userContext.subscriptionId, authorizationToken);
      }
    } catch (err) {
        xterminal.writeln('');
        xterminal.writeln('Unable to verify cloudshell provider registration.');
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        throw err;
    }

    const region = await getUserRegion(authorizationToken, userContext.subscriptionId).then((res) => {
    //   const reqId = (res.headers as any).get("x-ms-routing-request-id");
    //   const location = reqId?.split(":")?.[0]?.toLowerCase() ?? "";
    //   const validRegions = new Set(["westus", "southcentralus", "eastus", "northeurope", "westeurope", "centralindia", "southeastasia", "westcentralus", "eastus2euap", "centraluseuap"]);
    //   if (validRegions.has(location.toLowerCase())) {
    //       return location;
    //   }
    //   if (location === "centralus") {
    //       return "centraluseuap";
    //   }
    //   if (location === "eastus2") {
    //       return "eastus2euap";
    //   }
    //   return "westus";
    // }).catch((err) => {
    //   xterminal.writeln('');
    //   xterminal.writeln('Unable to get user region.');
    //   return "westus";
        return "westus";
    });
       
    //const cloudshellToken = await acquireMsalTokenForAccount(userContext.databaseAccount, false, "b677c290-cf4b-4a8e-a60e-91ba650a4abe");

    xterminal.writeln('Requested Region ' + region);
    const cloudshellToken = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImltaTBZMnowZFlLeEJ0dEFxS19UdDVoWUJUayIsImtpZCI6ImltaTBZMnowZFlLeEJ0dEFxS19UdDVoWUJUayJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNzQwMDQ2ODAzLCJuYmYiOjE3NDAwNDY4MDMsImV4cCI6MTc0MDA1MjQ4OSwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2U4MGZmZGE4LTlmZDUtNDQ4ZC05M2VhLWY5YzgyM2ZjN2RkOC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVpRQWEvOFpBQUFBVWd4YU5ram1kVWZ5VlhmR3kwODJzaEFkUEFQYkd6NW1TNDBjNW0zM3hjQTNCYmpOSTVjNTArVloxMFNCbzNGNjV2Rml6a2J4Z2VuNXk1dXQvWGVVZmUvNHMyb1lSdkczTnR4V2NJK09samI2aHRBQzNuSk5uQ1JINnNnUHNqd2VBZFkxcXZTTTFnMUtZVmZ5MG11Nm5aL0NYQWhCSkpoNWNLLzRNS0F5TzZvc2NDZjN0Q2N3dS9ZcXd6ZzIwbG9UIiwiYW1yIjpbInJzYSIsIm1mYSJdLCJhcHBpZCI6ImI2NzdjMjkwLWNmNGItNGE4ZS1hNjBlLTkxYmE2NTBhNGFiZSIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiZTM4YzBiOTgtMzQ5OS00YWQzLTkwN2EtYjc2NzJjNzdkZTQ3IiwiZmFtaWx5X25hbWUiOiJKYWluIiwiZ2l2ZW5fbmFtZSI6IlNvdXJhYmgiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNDA0OmY4MDE6ODAyODozOjhjZTU6MTk2ZDpjNWE3OmQ3YTYiLCJuYW1lIjoiU291cmFiaCBKYWluIiwib2lkIjoiZTgwZmZkYTgtOWZkNS00NDhkLTkzZWEtZjljODIzZmM3ZGQ4Iiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxNDY3NzMwODUtOTAzMzYzMjg1LTcxOTM0NDcwNy0yNzA3MDY2IiwicHVpZCI6IjEwMDMyMDAxMUE2OTQ1RjAiLCJyaCI6IjEuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUjBaSWYza0F1dGRQdWtQYXdmajJNQk1hQU9nYUFBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInNpZCI6IjAwMjAxMzA5LTJhNjAtY2M1Yy1iNTMxLTNiMGQwNWFkMWY3NSIsInN1YiI6Ijh4c0R4U0tqcmcycXdXaTNYM0pmLXkxUkNXUjZ2UDBEZ0pFbEtoTW05bTAiLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InNvdXJhYmhqYWluQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJzb3VyYWJoamFpbkBtaWNyb3NvZnQuY29tIiwidXRpIjoiN3BZYmN4MDRja3liNHZlYy1tMUdBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc19pZHJlbCI6IjI4IDEiLCJ4bXNfdGNkdCI6MTI4OTI0MTU0N30.A3eOAHuSDbA3w4n5r4xaMzpchoMuQMzAy7g7pyWGpY-zHsbUykUDYgbSOpAytMDzkcL9pbVCPlB8OxNnFOtgUn0lBRxmInCf-xWp38WoxSy_kqJ59i6PSmjSyNRVxHP70b3dNO3ZT6rkdvWWghaImTV-thQoSQyO7jYJrgEwhu8wNUV_uEQ67IGTKdylo0TupIxYW6VxpfMWfkVGaPRuZHnjQe14PwisZIJ9KJnTkgsszrv_fefbUkiE4dcG9PaWmIfSs7vLAsszNp2IozTo5VReZCztmxdTY1bNSRd2AKYb3wgywOTbB5DDzUxLLr2VofK946_eN8bHAm6uouiNOw";
    try {
      // do not use the subscription from the preferred settings use the one from the context
      await putEphemeralUserSettings(userContext.subscriptionId, region, `${cloudshellToken}`);
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to update user settings to ephemeral session.');
      intervalsToClear.forEach(val => window.clearInterval(+val));
      throw err;
    }

    // verify user settings after they have been updated to ephemeral
    try {
        const userSettings = await getUserSettings(cloudshellToken);
        const isValidUserSettings = validateUserSettings(userSettings);
        if (!isValidUserSettings) {
            throw new Error("Invalid user settings detected for ephemeral session.");
        }
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to verify user settings for ephemeral session.');
      xterminal.forEach((val) => window.clearInterval(+val));
      throw err;
    }

    // trigger callback to provision console internal
    let provisionConsoleResponse;
    try {
        provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, cloudshellToken, region);
       // statusPaneUpdateCommands.setTerminalUri(provisionConsoleResponse.properties.uri);
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to provision console.');
      intervalsToClear.forEach((val) => window.clearInterval(+val));
      throw err;
    }

    if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        xterminal.writeln("Failed to provision console.");
        throw new Error("Failed to provision console.");
    }

    xterminal.writeln("Connecting to cloudshell...");
    xterminal.writeln("Please wait...");
    // connect the terminal
    let connectTerminalResponse;
    try {
        connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, cloudshellToken, { rows: xterminal.rows, cols: xterminal.cols });
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to connect terminal.');
      intervalsToClear.forEach((val) => window.clearInterval(+val));
      throw err;
    }

    const targetUri = provisionConsoleResponse.properties.uri + `/terminals?cols=${xterminal.cols}&rows=${xterminal.rows}&version=2019-01-01&shell=bash`;
    const termId = connectTerminalResponse.id;
    //statusPaneUpdateCommands.setTermId(termId);
    
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
        const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri, cloudshellToken);
        const cookieToken = authorizeResponse.token;
        const a = document.createElement("img");
        a.src = targetUri + "&token=" + encodeURIComponent(cookieToken);
    } catch (err) {
        xterminal.writeln('Unable to authroize the session');
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        socket.close();
        throw err;
    }

    xterminal.writeln("Connected to cloudshell.");
    xterminal.focus();

    return socket;
}

export const validateUserSettings = (userSettings: Settings) => {
    if (userSettings.sessionType !== SessionType.Ephemeral && userSettings.osType !== OsType.Linux) {
        return false;
    } else {
        return true;
    }
}

export const enum OsType {
    Linux = "linux",
    Windows = "windows"
}

export const enum ShellType {
    Bash = "bash",
    PowerShellCore = "pwsh"
}
  
export const enum NetworkType {
    Default = "Default",
    Isolated = "Isolated"
}

export const enum SessionType {
    Mounted = "Mounted",
    Ephemeral = "Ephemeral"
}

// https://stackoverflow.com/q/38598280 (Is it possible to wrap a function and retain its types?)
export const trackedApiCall = <T extends Array<any>, U>(apiCall: (...args: T) => Promise<U>, name: string) => {
    return async (...args: T): Promise<U> => {
        const startTime = Date.now();
        const result = await apiCall(...args);
        const endTime = Date.now();
        return result;
    };
};

export const getUserRegion = trackedApiCall(async (authToken: string, subscriptionId: string) => {
    const locale = getLocale();
    const locationUri = getArmUri("management.azure.com")(`/subscriptions/${subscriptionId}/locations?api-version=2022-12-01`).toString();
    return await fetch(locationUri, {
        method: "get",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken,
            'Accept-Language': locale,
            'x-ms-correlation-request-id': uuidv4(),
        }
    });
}, "getUserRegion");

export type Settings = {
    location: string;
    sessionType: SessionType;
    osType: OsType;
};

export const getUserSettings = trackedApiCall(async (authToken: string): Promise<Settings> => {
    // figure out how to set the Accept-Language dynamically
    const armUri = getArmUri("management.azure.com")(`/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=2023-02-01-preview`).toString();;
    const locale = getLocale();
    const resp = await fetch(armUri, {
        method: "get",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken,
            'Accept-Language': locale,
            'x-ms-correlation-request-id': uuidv4(),
        }
    });

    const json = await resp?.json() as any;
    return {
        location: json?.properties?.preferredLocation,
        sessionType: json?.properties?.sessionType,
        osType: json?.properties?.preferredOsType
    };
}, "getUserSettings");

export const verifyCloudshellProviderRegistration = async(subscriptionId: string, authToken: string) => {
    const targetUri = getArmUri("management.azure.com")(`/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell?api-version=2022-12-01`).toString();
    const locale = getLocale();
    return await fetch(targetUri, {
        method: "get",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken,
            'Accept-Language': locale,
        }
    });
};

export const registerCloudShellProvider = async (subscriptionId: string, authToken: string) => {
    const targetUri = getArmUri("management.azure.com")(`/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell/register?api-version=2022-12-01`).toString();
    return await fetch(targetUri, {
        method: "post",
        headers: {
            'Content-Length': "0",
            'Content-Type': 'application/json',
            'Authorization': authToken
        }
    });
};

// TODO: update accept language header
export const putEphemeralUserSettings = trackedApiCall(async (userSubscriptionId: string, userRegion: string, authorizationToken: string) => {
    const ephemeralSettings = {
        properties: {
            preferredOsType: OsType.Linux,
            preferredShellType: ShellType.Bash,
            preferredLocation: userRegion,
            networkType: NetworkType.Default,
            sessionType: SessionType.Ephemeral,
            userSubscription: userSubscriptionId,
        }
    };

    const armUri = getArmUri("management.azure.com")(`/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=2023-02-01-preview`).toString();
    await fetch(armUri, {
        method: "put",
        body: JSON.stringify(ephemeralSettings),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authorizationToken,
            'Accept-Language': getLocale(),
        }
    });
}, "putEphemeralUserSettings");

type provisionConsoleResponse = {
    properties: {
        osType: OsType;
        provisioningState: string;
        uri: string;
    };
};

export const provisionConsole = trackedApiCall(async (subscriptionId: string, authorizationToken: string, location: string): Promise<provisionConsoleResponse> => {
    const armUri = getArmUri("management.azure.com")(`providers/Microsoft.Portal/consoles/default?api-version=2023-02-01-preview&feature.azureconsole.sessiontype=mounted&feature.azureconsole.usersubscription=${subscriptionId}`).toString();

    const data = {
        properties: {
            osType: OsType.Linux
        }
    };
    const resp = await fetch(armUri, {
        method: "put",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authorizationToken,
            'x-ms-console-preferred-location': location,
            'x-ms-correlation-request-id': uuidv4(),
            'Accept-Language': getLocale()
        },
        body: JSON.stringify(data)
    });
    return resp.json();
}, "provisionConsole");

export type ConnectTerminalResponse = {
    id: string;
    idleTimeout: string;
    rootDirectory: string;
    socketUri: string;
    tokenUpdated: boolean;
};

export const postTokens = trackedApiCall(async (consoleUri: string, authorizationToken: string) => {
    const targetUri = consoleUri + '/accessToken';
    let token = aadAuth.armToken;

    await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Authorization': authorizationToken,
            'x-ms-client-request-id': uuidv4(),
            'Accept-Language': getLocale()
        },
        body: JSON.stringify({ token })
    });
}, "postTokens");

export const connectTerminal = trackedApiCall(async (consoleUri: string, authorizationToken: string, size: { rows: number, cols: number }): Promise<ConnectTerminalResponse> => {
    const targetUri = consoleUri + `/terminals?cols=${size.cols}&rows=${size.rows}&version=2019-01-01&shell=bash`;
    const resp = await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': '2',
            'Authorization': authorizationToken,
            'x-ms-client-request-id': uuidv4(),
            'Accept-Language': getLocale(),
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
}, "connectTerminal");

export type Authorization = {
    token: string;
};

export const authorizeSession = trackedApiCall(async (consoleUri: string, accessToken: string): Promise<Authorization> => {
    const targetUri = consoleUri + "/authorize";
    const resp = await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Authorization': accessToken,
            'Accept-Language': getLocale(),
            "Content-Type": 'application/json'
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
}, "authorizeSession");


export const getArmUri = (origin: string): (relativePath: string) => string => {
let originNoTrailingSlash = origin;
if (origin.endsWith("/")) {
    originNoTrailingSlash = originNoTrailingSlash.slice(0, originNoTrailingSlash.length - 1);
} else {
    origin += "/";
}

return (relativePath: string) => {
    if (!relativePath) {
        throw new Error(`relativePath is required: ${relativePath}`);
    }

    return `https://${relativePath.charAt(0) === "/" ? originNoTrailingSlash : origin}${relativePath}`;
};
}

export const getLocale = () => {
    const langLocale = navigator.language;
    return (langLocale && langLocale.length === 2 ? langLocale[1] : 'en-us');
};

export const getTrustedParentOrigin = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("trustedAuthority") || '';
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

export default XTermComponent;
