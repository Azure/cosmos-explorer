import { JunoEndpoints } from "Common/Constants";
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

export class MongoProxyEndpoints {
  public static readonly Development: string = "https://localhost:7238";
  public static readonly Mpac: string = "https://cdb-ms-mpac-mp.cosmos.azure.com";
  public static readonly Prod: string = "https://cdb-ms-prod-mp.cosmos.azure.com";
  public static readonly Fairfax: string = "https://cdb-ff-prod-mp.cosmos.azure.us";
  public static readonly Mooncake: string = "https://cdb-mc-prod-mp.cosmos.azure.cn";
}

export const MongoProxyOutboundIPs: { [key: string]: string[] } = {
  [MongoProxyEndpoints.Mpac]: ["20.245.81.54", "40.118.23.126"],
  [MongoProxyEndpoints.Prod]: ["40.80.152.199", "13.95.130.121"],
  [MongoProxyEndpoints.Fairfax]: ["52.244.176.112", "52.247.148.42"],
  [MongoProxyEndpoints.Mooncake]: ["52.131.240.99", "143.64.61.130"],
};

export const allowedMongoProxyEndpoints: ReadonlyArray<string> = [
  MongoProxyEndpoints.Development,
  MongoProxyEndpoints.Mpac,
  MongoProxyEndpoints.Prod,
  MongoProxyEndpoints.Fairfax,
  MongoProxyEndpoints.Mooncake,
];

export const allowedMongoProxyEndpoints_ToBeDeprecated: ReadonlyArray<string> = [
  "https://main.documentdb.ext.azure.com",
  "https://main.documentdb.ext.azure.cn",
  "https://main.documentdb.ext.azure.us",
  "https://main.cosmos.ext.azure",
  "https://localhost:12901",
];

export class CassandraProxyEndpoints {
  public static readonly Development: string = "https://localhost:7240";
  public static readonly Mpac: string = "https://cdb-ms-mpac-cp.cosmos.azure.com";
  public static readonly Prod: string = "https://cdb-ms-prod-cp.cosmos.azure.com";
  public static readonly Fairfax: string = "https://cdb-ff-prod-cp.cosmos.azure.us";
  public static readonly Mooncake: string = "https://cdb-mc-prod-cp.cosmos.azure.cn";
}

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
