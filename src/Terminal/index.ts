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

const initTerminal = async (props: TerminalProps): Promise<ITerminalConnection | undefined> => {
  // Initialize userContext (only properties which are needed by TelemetryProcessor)
  updateUserContext({
    subscriptionId: props.subscriptionId,
    apiType: props.apiType,
    authType: props.authType,
    databaseAccount: props.databaseAccount,
  });

  const serverSettings = createServerSettings(props);
  const data = { baseUrl: serverSettings.baseUrl };
  const startTime = TelemetryProcessor.traceStart(Action.OpenTerminal, data);

  try {
    const session = await new JupyterLabAppFactory(() => closeTab(props.tabId)).createTerminalApp(serverSettings);
    TelemetryProcessor.traceSuccess(Action.OpenTerminal, data, startTime);
    return session;
  } catch (error) {
    TelemetryProcessor.traceFailure(Action.OpenTerminal, data, startTime);
    return undefined;
  }
};

const closeTab = (tabId: string): void => {
  window.parent.postMessage(
    { type: MessageTypes.CloseTab, data: { tabId: tabId }, signature: "pcIframe" },
    window.document.referrer,
  );
};

const main = async (): Promise<void> => {
  let session: ITerminalConnection | undefined;
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
      session = await initTerminal(props);
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
