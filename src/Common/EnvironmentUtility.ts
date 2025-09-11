import { AadScopeEndpoints, PortalBackendEndpoints } from "Common/Constants";
import * as Logger from "Common/Logger";
import { configContext } from "ConfigContext";

export function normalizeArmEndpoint(uri: string): string {
  if (uri && uri.slice(-1) !== "/") {
    return `${uri}/`;
  }
  return uri;
}

export enum Environment {
  Development = "Development",
  Mpac = "MPAC",
  Prod = "Prod",
  Fairfax = "Fairfax",
  Mooncake = "Mooncake",
}

export const getEnvironment = (): Environment => {
  const environmentMap: { [key: string]: Environment } = {
    [PortalBackendEndpoints.Development]: Environment.Development,
    [PortalBackendEndpoints.Mpac]: Environment.Mpac,
    [PortalBackendEndpoints.Prod]: Environment.Prod,
    [PortalBackendEndpoints.Fairfax]: Environment.Fairfax,
    [PortalBackendEndpoints.Mooncake]: Environment.Mooncake,
  };

  return environmentMap[configContext.PORTAL_BACKEND_ENDPOINT];
};

export const getEnvironmentScopeEndpoint = (): string => {
  const environment = getEnvironment();
  const endpoint = AadScopeEndpoints[environment];
  if (!endpoint) {
    throw new Error("Cannot determine AAD scope endpoint");
  }
  const hrefEndpoint = new URL(endpoint).href.replace(/\/+$/, "/.default");
  Logger.logInfo(
    `Using AAD scope endpoint: ${hrefEndpoint}, Environment: ${environment}`,
    "EnvironmentUtility/getEnvironmentScopeEndpoint"
  );
  return hrefEndpoint;
};