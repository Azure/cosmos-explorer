import { JunoEndpoints } from "Common/Constants";
import * as Logger from "../Common/Logger";

export function validateEndpoint(
  endpointToValidate: string | undefined,
  allowedEndpoints: ReadonlyArray<string>
): boolean {
  try {
    return validateEndpointInternal(
      endpointToValidate,
      allowedEndpoints.map((e) => e)
    );
  } catch (reason) {
    Logger.logError(`${endpointToValidate} not allowed`, "validateEndpoint");
    Logger.logError(`${JSON.stringify(reason)}`, "validateEndpoint");
    return false;
  }
}

function validateEndpointInternal(
  endpointToValidate: string | undefined,
  allowedEndpoints: ReadonlyArray<string>
): boolean {
  if (endpointToValidate === undefined) {
    return false;
  }

  const originToValidate: string = new URL(endpointToValidate).origin;
  const allowedOrigins: string[] = allowedEndpoints.map((allowedEndpoint) => new URL(allowedEndpoint).origin) || [];
  const valid = allowedOrigins.indexOf(originToValidate) >= 0;

  if (!valid) {
    throw new Error(
      `${endpointToValidate} is not an allowed endpoint. Allowed endpoints are ${allowedEndpoints.toString()}`
    );
  }

  return valid;
}

export const defaultAllowedArmEndpoints: ReadonlyArray<string> = [
  "https://​management.azure.com",
  "https://​management.usgovcloudapi.net",
  "https://management.chinacloudapi.cn",
];

export const allowedAadEndpoints: ReadonlyArray<string> = ["https://login.microsoftonline.com/"];

export const defaultAllowedBackendEndpoints: ReadonlyArray<string> = [
  "https://main.documentdb.ext.azure.com",
  "https://main.documentdb.ext.azure.cn",
  "https://main.documentdb.ext.azure.us",
  "https://main.cosmos.ext.azure",
  "https://localhost:12901",
  "https://localhost:1234",
];

export const PortalBackendIPs: { [key: string]: string[] } = {
  "https://main.documentdb.ext.azure.com": ["104.42.195.92", "40.76.54.131"],
  // DE doesn't talk to prod2 (main2) but it might be added
  //"https://main2.documentdb.ext.azure.com": ["104.42.196.69"],
  "https://main.documentdb.ext.azure.cn": ["139.217.8.252"],
  "https://main.documentdb.ext.azure.us": ["52.244.48.71"],
  // Add ussec and usnat when endpoint address is known:
  //ussec: ["29.26.26.67", "29.26.26.66"],
  //usnat: ["7.28.202.68"],
};

export const allowedMongoProxyEndpoints: ReadonlyArray<string> = [
  "https://main.documentdb.ext.azure.com",
  "https://main.documentdb.ext.azure.cn",
  "https://main.documentdb.ext.azure.us",
  "https://main.cosmos.ext.azure",
  "https://localhost:12901",
];

export const allowedEmulatorEndpoints: ReadonlyArray<string> = ["https://localhost:8081"];

export const allowedMongoBackendEndpoints: ReadonlyArray<string> = ["https://localhost:1234"];

export const allowedGraphEndpoints: ReadonlyArray<string> = ["https://graph.microsoft.com"];

export const allowedArcadiaEndpoints: ReadonlyArray<string> = ["https://workspaceartifacts.projectarcadia.net"];

export const allowedHostedExplorerEndpoints: ReadonlyArray<string> = ["https://cosmos.azure.com/"];

export const allowedMsalRedirectEndpoints: ReadonlyArray<string> = [
  "https://cosmos-explorer-preview.azurewebsites.net/",
];

export const allowedJunoOrigins: ReadonlyArray<string> = [
  JunoEndpoints.Test,
  JunoEndpoints.Test2,
  JunoEndpoints.Test3,
  JunoEndpoints.Prod,
  JunoEndpoints.Stage,
  "https://localhost",
];

export const allowedNotebookServerUrls: ReadonlyArray<string> = [];
