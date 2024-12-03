import { CassandraProxyEndpoints, JunoEndpoints, MongoProxyEndpoints, PortalBackendEndpoints } from "Common/Constants";
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

export const allowedAadEndpoints: ReadonlyArray<string> = [
  "https://login.microsoftonline.com/",
  "https://login.microsoftonline.us/",
  "https://login.partner.microsoftonline.cn/",
];

export const PortalBackendOutboundIPs: { [key: string]: string[] } = {
  [PortalBackendEndpoints.Mpac]: ["13.91.105.215", "4.210.172.107"],
  [PortalBackendEndpoints.Prod]: ["13.88.56.148", "40.91.218.243"],
  [PortalBackendEndpoints.Fairfax]: ["52.247.163.6", "52.244.134.181"],
  [PortalBackendEndpoints.Mooncake]: ["163.228.137.6", "143.64.170.142"],
};

export const MongoProxyOutboundIPs: { [key: string]: string[] } = {
  [MongoProxyEndpoints.Mpac]: ["20.245.81.54", "40.118.23.126"],
  [MongoProxyEndpoints.Prod]: ["40.80.152.199", "13.95.130.121"],
  [MongoProxyEndpoints.Fairfax]: ["52.244.176.112", "52.247.148.42"],
  [MongoProxyEndpoints.Mooncake]: ["52.131.240.99", "143.64.61.130"],
};

export const defaultAllowedPortalBackendEndpoints: ReadonlyArray<string> = [
  PortalBackendEndpoints.Development,
  PortalBackendEndpoints.Mpac,
  PortalBackendEndpoints.Prod,
  PortalBackendEndpoints.Fairfax,
  PortalBackendEndpoints.Mooncake,
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

export const CassandraProxyOutboundIPs: { [key: string]: string[] } = {
  [CassandraProxyEndpoints.Mpac]: ["40.113.96.14", "104.42.11.145"],
  [CassandraProxyEndpoints.Prod]: ["137.117.230.240", "168.61.72.237"],
  [CassandraProxyEndpoints.Fairfax]: ["52.244.50.101", "52.227.165.24"],
  [CassandraProxyEndpoints.Mooncake]: ["40.73.99.146", "143.64.62.47"],
};

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
