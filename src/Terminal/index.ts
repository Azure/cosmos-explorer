import { ServerConnection } from "@jupyterlab/services";
import { IMessage, ITerminalConnection } from "@jupyterlab/services/lib/terminal/terminal";
import "@jupyterlab/terminal/style/index.css";
import { MessageTypes } from "Contracts/ExplorerContracts";
import postRobot from "post-robot";
import { HttpHeaders } from "../Common/Constants";
import { Action } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../UserContext";
import { JupyterLabAppFactory } from "./JupyterLabAppFactory";
import { TerminalProps } from "./TerminalProps";
import "./index.css";

let session: ITerminalConnection | undefined;

const createServerSettings = (props: TerminalProps): ServerConnection.ISettings => {
  let body: BodyInit | undefined;
  let headers: HeadersInit | undefined;
  if (props.terminalEndpoint) {
    let bodyObj: { endpoint: string; username?: string } = {
      endpoint: props.terminalEndpoint,
    };
    if (props.username) {
      bodyObj = {
        ...bodyObj,
        username: props.username,
      };
    }
    body = JSON.stringify(bodyObj);
    headers = {
      [HttpHeaders.contentType]: "application/json",
    };
  }

  const server = props.notebookServerEndpoint;
  let options: Partial<ServerConnection.ISettings> = {
    baseUrl: server,
    init: { body, headers },
    fetch: window.parent.fetch,
  };
  if (props.authToken) {
    options = {
      baseUrl: server,
      token: props.authToken,
      appendToken: true,
      init: { body, headers },
      fetch: window.parent.fetch,
    };
  }

  return ServerConnection.makeSettings(options);
};

const initTerminal = async (props: TerminalProps): Promise<void> => {
  // Initialize userContext (only properties which are needed by TelemetryProcessor)
  updateUserContext({
    subscriptionId: props.subscriptionId,
    apiType: props.apiType,
    authType: props.authType,
    databaseAccount: props.databaseAccount,
  });

  const serverSettings = createServerSettings(props);

  createTerminalApp(props, serverSettings);
};

const createTerminalApp = async (props: TerminalProps, serverSettings: ServerConnection.ISettings) => {
  const data = { baseUrl: serverSettings.baseUrl };
  const startTime = TelemetryProcessor.traceStart(Action.OpenTerminal, data);

  try {
    session = await new JupyterLabAppFactory((restartShell: boolean) =>
      closeTab(props, serverSettings, restartShell),
    ).createTerminalApp(serverSettings);
    TelemetryProcessor.traceSuccess(Action.OpenTerminal, data, startTime);
  } catch (error) {
    TelemetryProcessor.traceFailure(Action.OpenTerminal, data, startTime);
    session = undefined;
  }
};

const closeTab = (props: TerminalProps, serverSettings: ServerConnection.ISettings, restartShell: boolean): void => {
  if (restartShell) {
    createTerminalApp(props, serverSettings);
  } else {
    window.parent.postMessage(
      { type: MessageTypes.CloseTab, data: { tabId: props.tabId }, signature: "pcIframe" },
      window.document.referrer,
    );
  }
};

const main = async (): Promise<void> => {
  postRobot.on(
    "props",
    {
      window: window.parent,
      domain: window.location.origin,
    },
    async (event) => {
      // Typescript definition for event is wrong. So read props by casting to <any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = (event as any).data as TerminalProps;
      await initTerminal(props);
    },
  );

  postRobot.on(
    "sendMessage",
    {
      window: window.parent,
      domain: window.location.origin,
    },
    async (event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (event as any).data as IMessage;
      if (session) {
        session.send(message);
      }
    },
  );
};

window.addEventListener("load", main);
