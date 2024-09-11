import { PortalBackendEndpoints } from "Common/Constants";
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
