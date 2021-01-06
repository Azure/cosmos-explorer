import "babel-polyfill";
import "promise-polyfill/src/polyfill"; // polyfill Promise on IE
import "@jupyterlab/terminal/style/index.css";
import "./index.css";
import { ServerConnection } from "@jupyterlab/services";
import { JupyterLabAppFactory } from "./JupyterLabAppFactory";
import { Action } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext } from "../UserContext";
import { HttpHeaders, TerminalQueryParams } from "../Common/Constants";

const getUrlVars = (): { [key: string]: string } => {
  const vars: { [key: string]: string } = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value): string => {
    vars[key] = decodeURIComponent(value);
    return value;
  });
  return vars;
};

const createServerSettings = (urlVars: { [key: string]: string }): ServerConnection.ISettings => {
  let body: BodyInit;
  let headers: HeadersInit;
  if (urlVars.hasOwnProperty(TerminalQueryParams.TerminalEndpoint)) {
    body = JSON.stringify({
      endpoint: urlVars[TerminalQueryParams.TerminalEndpoint],
      account:"contoso-retail-mongodb",
      port: "10255",
      token:"" //tofill
    });
    headers = {
      [HttpHeaders.contentType]: "application/json"
      //"Access-Control-Allow-Origin": "https://localhost:5001"
    };
  }

  const server = urlVars[TerminalQueryParams.Server];
  let options: Partial<ServerConnection.ISettings> = {
    baseUrl: server,
    init: { body, headers },
    fetch: window.parent.fetch
  };
  if (urlVars.hasOwnProperty(TerminalQueryParams.Token)) {
    options = {
      baseUrl: server,
      token: urlVars[TerminalQueryParams.Token],
      appendToken: true,
      init: { body, headers },
      fetch: window.parent.fetch
    };
  }

  return ServerConnection.makeSettings(options);
};

const main = async (): Promise<void> => {
  const urlVars = getUrlVars();

  // Initialize userContext. Currently only subscrptionId is required by TelemetryProcessor
  updateUserContext({
    subscriptionId: urlVars[TerminalQueryParams.SubscriptionId]
  });

  const serverSettings = createServerSettings(urlVars);

  const startTime = TelemetryProcessor.traceStart(Action.OpenTerminal, {
    baseUrl: serverSettings.baseUrl
  });

  try {
    if (urlVars.hasOwnProperty(TerminalQueryParams.Terminal)) {
      await JupyterLabAppFactory.createTerminalApp(serverSettings);
    } else {
      throw new Error("Only terminal is supported");
    }

    TelemetryProcessor.traceSuccess(Action.OpenTerminal, startTime);
  } catch (error) {
    TelemetryProcessor.traceFailure(Action.OpenTerminal, startTime);
  }
};

window.addEventListener("load", main);
