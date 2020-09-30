import "babel-polyfill";
import "promise-polyfill/src/polyfill"; // polyfill Promise on IE
import "@jupyterlab/terminal/style/index.css";
import "./index.css";
import { ServerConnection } from "@jupyterlab/services";
import { JupyterLabAppFactory } from "./JupyterLabAppFactory";

const getUrlVars = (): { [key: string]: string } => {
  const vars: { [key: string]: string } = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value): string => {
    vars[key] = decodeURIComponent(value);
    return value;
  });
  return vars;
};

const main = (): void => {
  const urlVars = getUrlVars();
  console.log("URL parameters", urlVars);

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
      appendToken: true,
      init: { body },
      fetch: window.parent.fetch
    };
  }
  const serverSettings = ServerConnection.makeSettings(options);

  if (urlVars.hasOwnProperty("terminal")) {
    JupyterLabAppFactory.createTerminalApp(serverSettings);
    return;
  }

  throw new Error("Only terminal is supported");
};

window.addEventListener("load", main);
