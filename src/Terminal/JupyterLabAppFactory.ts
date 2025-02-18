/**
 * JupyterLab applications based on jupyterLab components
 */
import { ServerConnection } from "@jupyterlab/services";
import { Panel, Widget } from "@phosphor/widgets";
import { useRef } from 'react';
import { userContext } from "UserContext";
import { v4 as uuidv4 } from 'uuid';
import { Terminal as XTerminal } from 'xterm';
import { useAADAuth } from "../hooks/useAADAuth";

export class JupyterLabAppFactory {
  private isShellStarted: boolean | undefined;
  private checkShellStarted: ((content: string | undefined) => void) | undefined;
  private onShellExited: (restartShell: boolean) => void;
  private restartShell: boolean;

  private isShellExited(content: string | undefined) {
    if (userContext.apiType === "VCoreMongo" && content?.includes("MongoServerError: Invalid key")) {
      this.restartShell = true;
    }
    return content?.includes("cosmosuser@");
  }

  private isMongoShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("MongoDB shell version");
  }

  private isCassandraShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("Connected to") && content?.includes("cqlsh");
  }

  private isPostgresShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("citus=>");
  }

  private isVCoreMongoShellStarted(content: string | undefined) {
    this.isShellStarted = content?.includes("Enter password");
  }

  constructor(closeTab: (restartShell: boolean) => void) {
    this.onShellExited = closeTab;
    this.isShellStarted = false;
    this.checkShellStarted = undefined;
    this.restartShell = false;

    switch (userContext.apiType) {
      case "Mongo":
        this.checkShellStarted = this.isMongoShellStarted;
        break;
      case "Cassandra":
        this.checkShellStarted = this.isCassandraShellStarted;
        break;
      case "Postgres":
        this.checkShellStarted = this.isPostgresShellStarted;
        break;
      case "VCoreMongo":
        this.checkShellStarted = this.isVCoreMongoShellStarted;
        break;
    }
  }

  public async createTerminalApp(serverSettings: ServerConnection.ISettings): Promise<XTerminal | undefined> {
    // const configurationSettings: Partial<ServerConnection.ISettings> = serverSettings;
    // (configurationSettings.appendToken as boolean) = false;
    // serverSettings = ServerConnection.makeSettings(configurationSettings);
    // const manager = new TerminalManager({
    //   serverSettings: serverSettings,
    // });
    // const session = await manager.startNew();
    // session.messageReceived.connect(async (_, message: IMessage) => {
    //   const content = message.content && message.content[0]?.toString();

    //   if (this.checkShellStarted && message.type == "stdout") {
    //     //Close the terminal tab once the shell closed messages are received
    //     if (!this.isShellStarted) {
    //       this.checkShellStarted(content);
    //     } else if (this.isShellExited(content)) {
    //       this.onShellExited(this.restartShell);
    //     }
    //   }
    // }, this);

    // let internalSend = session.send;
    // session.send = (message: IMessage) => {
    //   message?.content?.push(serverSettings?.token);
    //   internalSend.call(session, message);
    // };
    // const term = new Terminal(session, { theme: "dark", shutdownOnClose: true });

    // if (!term) {
    //   console.error("Failed starting terminal");
    //   return undefined;
    // }

    // term.title.closable = false;
    // term.addClass("terminalWidget");

    // let panel = new Panel();
    // panel.addWidget(term as any);
    // panel.id = "main";

    // // Attach the widget to the dom.
    // Widget.attach(panel, document.body);

    // // Switch focus to the terminal
    // term.activate();

    const xterminal = new XTerminal({

      convertEol: true
    });

    
    let panel = new Panel();
    panel.addWidget(xterminal as any);
    panel.id = "xMain";

    Widget.attach(panel, document.body);
    xterminal.write('I am new shell');

    this.startCloudShellterminal(xterminal);

    // Handle resize events.
    window.addEventListener("resize", () => {
      panel.update();
    });

    // Dispose terminal when unloading.
    window.addEventListener("unload", () => {
      panel.dispose();
    });

    return xterminal;
  }

  public async startCloudShellterminal(xterminal: XTerminal) 
  {
    const intervalsToClearRef = useRef<NodeJS.Timer[]>([]);

    const allowedParentFrameAuthorities = ["localhost:3000", "portal.azure.com", "portal.azure.us", "rc.portal.azure.com", "ms.portal.azure.com", "canary.portal.azure.com", "canary-ms.portal.azure.com", "docs.microsoft.com", "review.docs.microsoft.com", "ppe.docs.microsoft.com", "ux.console.azure.us", "admin-local.teams.microsoft.net", "admin-ignite.microsoft.com", "wusportalprv.office.com", "portal-sdf.office.com", "ncuportalprv.office.com", "admin.microsoft.com", "portal.microsoft.com", "portal.office.com", "admin.microsoft365.com", "admin-sdf.exchange.microsoft.com", "admin.exchange.microsoft.com", "cloudconsole-ux-prod-usnatwest.appservice.eaglex.ic.gov", "cloudconsole-ux-prod-usnateast.appservice.eaglex.ic.gov", "portal.azure.eaglex.ic.gov", "cloudconsole-ux-prod-ussecwest.appservice.microsoft.scloud", "cloudconsole-ux-prod-usseceast.appservice.microsoft.scloud", "portal.azure.microsoft.scloud", "admin-local.teams.microsoft.net", "admin-dev.teams.microsoft.net", "admin-int.teams.microsoft.net", "admin.teams.microsoft.com", "preview.portal.azure.com", "learn.microsoft.com", "review.learn.microsoft.com", "ppe.learn.microsoft.com", "dev.learn.microsoft.com"];
    const trustedParentOrigin = getTrustedParentOrigin();
    let trustedAuthority = (trustedParentOrigin.split("//")[1] || "").toLowerCase();
    const isTrustedOrigin = allowedParentFrameAuthorities.some(origin => origin === trustedAuthority);

    if (!isTrustedOrigin) {
        const errorMessage = "The origin '" + trustedParentOrigin + "' is not trusted.";
        xterminal.writeln('');
        xterminal.writeln('errorMessage');
        throw new Error(errorMessage);
    }

    trustedAuthority = (trustedParentOrigin.indexOf("https") === 0 ? "https://" : "http://") + trustedAuthority;

    let aadAuth = useAADAuth();
    let authorizationToken = aadAuth.armToken;
    const tokenInterval = setInterval(async () => {
        authorizationToken = aadAuth.armToken;
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
      const reqId = (res.headers as any).get("x-ms-request-id");
      const location = reqId?.split(":")?.[0]?.toLowerCase() ?? "";
      const validRegions = new Set(["westus", "southcentralus", "eastus", "northeurope", "westeurope", "centralindia", "southeastasia", "westcentralus", "eastus2euap", "centraluseuap"]);
      if (validRegions.has(location)) {
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

    try {
      // do not use the subscription from the preferred settings use the one from the context
      await putEphemeralUserSettings(userContext.subscriptionId, region, authorizationToken);
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to update user settings to ephemeral session.');
      intervalsToClear.forEach(val => window.clearInterval(+val));
      throw err;
    }

    // verify user settings after they have been updated to ephemeral
    try {
        const userSettings = await getUserSettings(authorizationToken);
        const isValidUserSettings = this.validateUserSettings(userSettings);
        if (!isValidUserSettings) {
            throw new Error("Invalid user settings detected for ephemeral session.");
        }
    } catch (err) {
      xterminal.writeln('');
      xterminal.writeln('Unable to verify user settings for ephemeral session.');
      //xterminal.forEach((val) => window.clearInterval(+val));
      throw err;
    }

    // trigger callback to provision console internal
    let provisionConsoleResponse;
    try {
        provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, authorizationToken, region);
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
        connectTerminalResponse = await connectTerminal(provisionConsoleResponse.properties.uri, authorizationToken, { rows: xterminal.rows, cols: xterminal.cols });
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

    // provision appropriate first party permissions to cloudshell instance
    await postTokens(provisionConsoleResponse.properties.uri, authorizationToken).catch((err) => {
        xterminal.writeln('Unable to provision first party permissions to cloudshell instance.');
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        throw err;
    });

    const socket = new WebSocket(socketUri);

    configureSocket(socket, socketUri, xterminal, intervalsToClear, 0);

    // authorize the session
    try {
        const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri, authorizationToken);
        const cookieToken = authorizeResponse.token;
        const a = document.createElement("img");
        a.src = targetUri + "?token=" + encodeURIComponent(cookieToken);
    } catch (err) {
        xterminal.writeln('Unable to authroize the session');
        intervalsToClear.forEach((val) => window.clearInterval(+val));
        socket.close();
        throw err;
    }
  }

  public validateUserSettings(userSettings: Settings) {
    if (userSettings.sessionType !== SessionType.Ephemeral && userSettings.osType !== OsType.Linux) {
        return false;
    } else {
        return true;
    }
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
    const locationUri = getArmUri(`/subscriptions/${subscriptionId}/locations?api-version=2022-12-01`).toString();
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
    const armUri = getArmUri(`/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=2023-02-01-preview`).toString();;
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
    const targetUri = getArmUri(`/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell?api-version=2022-12-01`).toString();
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
    const targetUri = getArmUri(`/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell/register?api-version=2022-12-01`).toString();
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

    const armUri = getArmUri("/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=2023-02-01-preview").toString();
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
    const armUri = getArmUri(`providers/Microsoft.Portal/consoles/default?api-version=2023-02-01-preview&feature.azureconsole.sessiontype=mounted&feature.azureconsole.usersubscription=${subscriptionId}`).toString();

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
    let aadAuth = useAADAuth();
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

export type Authroization = {
    token: string;
};

export const authorizeSession = trackedApiCall(async (consoleUri: string, accessToken: string): Promise<Authroization> => {
    const targetUri = consoleUri + "/authorize";
    const resp = await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Authorization': accessToken,
            'Accept-Language': getLocale(),
            "Content-Type": 'application/json'
        }
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

      return `${relativePath.charAt(0) === "/" ? originNoTrailingSlash : origin}${relativePath}`;
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

export const configureSocket = (socket: WebSocket,  uri: string, terminal: XTerminal, intervals: NodeJS.Timer[], socketRetryCount: number) => {
  let jsonData = '';

  socket.onopen = () => {
      const initializeCommand =
          `rm -rf ie.log && rm -rf ie && rm -rf scenarios/ && \n` +
          `echo Welcome to this quick start shell. This Cloud Shell terminal will be used to execute commands as part of the scenario. Follow the instructions on the left to get started\n`;

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
