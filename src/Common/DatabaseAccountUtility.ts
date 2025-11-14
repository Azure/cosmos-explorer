import { TagNames, WorkloadType } from "Common/Constants";
import { Tags } from "Contracts/DataModels";
import { isFabric } from "Platform/Fabric/FabricUtil";
import { ApiType, userContext } from "../UserContext";

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

export function isGlobalSecondaryIndexEnabled(): boolean {
  return (
    !isFabric() && userContext.apiType === "SQL" && userContext.databaseAccount?.properties?.enableMaterializedViews
  );
}

export const getDatabaseEndpoint = (apiType: ApiType): string => {
  switch (apiType) {
    case "Mongo":
      return "mongodbDatabases";
    case "Cassandra":
      return "cassandraKeyspaces";
    case "Gremlin":
      return "gremlinDatabases";
    case "Tables":
      return "tables";
    default:
    case "SQL":
      return "sqlDatabases";
  }
};

export const getCollectionEndpoint = (apiType: ApiType): string => {
  switch (apiType) {
    case "Mongo":
      return "collections";
    case "Cassandra":
      return "tables";
    case "Gremlin":
      return "graphs";
    default:
    case "SQL":
      return "containers";
  }
};
