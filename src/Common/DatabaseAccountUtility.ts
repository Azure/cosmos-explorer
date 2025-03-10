import { TagNames, WorkloadType } from "Common/Constants";
import { Tags } from "Contracts/DataModels";
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

export function getWorkloadType(): WorkloadType {
  const tags: Tags = userContext?.databaseAccount?.tags;
  const workloadType: WorkloadType = tags && (tags[TagNames.WorkloadType] as WorkloadType);
  if (!workloadType) {
    return WorkloadType.None;
  }
  return workloadType;
}

export function isMaterializedViewsEnabled() {
  return userContext.apiType === "SQL" && userContext.databaseAccount?.properties?.enableMaterializedViews;
}
