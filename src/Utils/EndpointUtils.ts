import { CassandraProxyEndpoints, JunoEndpoints, MongoProxyEndpoints } from "Common/Constants";
import * as Logger from "../Common/Logger";

export function validateEndpoint(
  endpointToValidate: string | undefined,
  allowedEndpoints: ReadonlyArray<string>,
): boolean {
  try {
    return validateEndpointInternal(
      endpointToValidate,
      allowedEndpoints.map((e) => e),
    );
  } catch (reason) {
    Logger.logError(`${endpointToValidate} not allowed`, "validateEndpoint");
    Logger.logError(`${JSON.stringify(reason)}`, "validateEndpoint");
    return false;
  }
}

function validateEndpointInternal(
  endpointToValidate: string | undefined,
  allowedEndpoints: ReadonlyArray<string>,
): boolean {
  if (endpointToValidate === undefined) {
    return false;
  }

  const originToValidate: string = new URL(endpointToValidate).origin;
  const allowedOrigins: string[] = allowedEndpoints.map((allowedEndpoint) => new URL(allowedEndpoint).origin) || [];
  const valid = allowedOrigins.indexOf(originToValidate) >= 0;

  if (!valid) {
    throw new Error(
      `${endpointToValidate} is not an allowed endpoint. Allowed endpoints are ${allowedEndpoints.toString()}`,
    );
  }

  return valid;
}

export const defaultAllowedArmEndpoints: ReadonlyArray<string> = [
  "https://api-dogfood.resources.windows-int.net/",
  "https://​management.azure.com",
  "https://​management.usgovcloudapi.net",
  "https://management.chinacloudapi.cn",
];

export const defaultAllowedAadEndpoints: ReadonlyArray<string> = [
  "https://login.microsoftonline.com/",
  "https://login.microsoftonline.us/",
  "https://login.partner.microsoftonline.cn/",
];

export const defaultAllowedGraphEndpoints: ReadonlyArray<string> = ["https://graph.microsoft.com"];

export const defaultAllowedBackendEndpoints: ReadonlyArray<string> = [
  "https://localhost:12901",
  "https://localhost:1234",
];

export const defaultAllowedMongoProxyEndpoints: ReadonlyArray<string> = [
  MongoProxyEndpoints.Development,
  MongoProxyEndpoints.Mpac,
  MongoProxyEndpoints.Prod,
  MongoProxyEndpoints.Fairfax,
  MongoProxyEndpoints.Mooncake,
];

export const defaultAllowedCassandraProxyEndpoints: ReadonlyArray<string> = [
  CassandraProxyEndpoints.Development,
  CassandraProxyEndpoints.Mpac,
  CassandraProxyEndpoints.Prod,
  CassandraProxyEndpoints.Fairfax,
  CassandraProxyEndpoints.Mooncake,
];

export const allowedEmulatorEndpoints: ReadonlyArray<string> = ["https://localhost:8081"];

export const allowedArcadiaEndpoints: ReadonlyArray<string> = ["https://workspaceartifacts.projectarcadia.net"];

export const allowedHostedExplorerEndpoints: ReadonlyArray<string> = ["https://cosmos.azure.com/"];

export const allowedMsalRedirectEndpoints: ReadonlyArray<string> = ["https://dataexplorer-preview.azurewebsites.net/"];

export const allowedJunoOrigins: ReadonlyArray<string> = [
  JunoEndpoints.Test,
  JunoEndpoints.Test2,
  JunoEndpoints.Test3,
  JunoEndpoints.Prod,
  JunoEndpoints.Stage,
  "https://localhost",
];

export const allowedNotebookServerUrls: ReadonlyArray<string> = [];
