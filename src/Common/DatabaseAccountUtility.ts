import { userContext } from "../UserContext";

function isVirtualNetworkFilterEnabled() {
  return userContext.databaseAccount?.properties?.isVirtualNetworkFilterEnabled;
}

function isIpRulesEnabled() {
  return userContext.databaseAccount?.properties?.ipRules?.length > 0;
}

function isPrivateEndpointConnectionsEnabled() {
  return userContext.databaseAccount?.properties?.privateEndpointConnections?.length > 0;
}

export function isPublicInternetAccessAllowed(): boolean {
  return !isVirtualNetworkFilterEnabled() && !isIpRulesEnabled() && !isPrivateEndpointConnectionsEnabled();
}
