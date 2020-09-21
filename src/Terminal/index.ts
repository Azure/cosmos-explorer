import "babel-polyfill";
import "promise-polyfill/src/polyfill"; // polyfill Promise on IE
import "@jupyterlab/terminal/style/index.css";
import "./index.css";
import { ServerConnection } from "@jupyterlab/services";
import { JupyterLabAppFactory } from "./JupyterLabAppFactory";
import { Action } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";

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
  if (urlVars.hasOwnProperty("terminalEndpoint")) {
    body = JSON.stringify({
      endpoint: urlVars["terminalEndpoint"]
    });
  }

  const server = urlVars["server"];
  let options: Partial<ServerConnection.ISettings> = {
    baseUrl: server,
    init: { body },
    fetch: window.parent.fetch
  };
  if (urlVars.hasOwnProperty("token")) {
    options = {
      baseUrl: server,
      token: urlVars["token"],
      init: { body },
      fetch: window.parent.fetch
    };
  }

  return ServerConnection.makeSettings(options);
};

const main = async (): Promise<void> => {
  const urlVars = getUrlVars();
  const serverSettings = createServerSettings(urlVars);

  const startTime = TelemetryProcessor.traceStart(Action.OpenTerminal, {
    baseUrl: serverSettings.baseUrl
  });

  try {
    if (urlVars.hasOwnProperty("terminal")) {
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
