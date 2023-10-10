import * as Cosmos from "@azure/cosmos";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { PriorityLevel } from "../Common/Constants";
import { userContext } from "../UserContext";

export function isFeatureEnabled(): boolean {
  return (
    userContext.apiType === "SQL" &&
    (userContext.databaseAccount?.properties?.enablePriorityBasedExecution ||
      userContext.features.enablePriorityBasedExecution)
  );
}

export function isRelevantRequest(requestContext: Cosmos.RequestContext): boolean {
  return (
    requestContext.resourceType === Cosmos.ResourceType.item ||
    requestContext.resourceType === Cosmos.ResourceType.conflicts ||
    (requestContext.resourceType === Cosmos.ResourceType.sproc &&
      requestContext.operationType === Cosmos.OperationType.Execute)
  );
}

export function getPriorityLevel(): PriorityLevel {
  const priorityLevel = LocalStorageUtility.getEntryString(StorageKey.PriorityLevel);
  if (priorityLevel && Object.values(PriorityLevel).includes(priorityLevel)) {
    return priorityLevel as PriorityLevel;
  } else {
    return PriorityLevel.Default;
  }
}

export const requestPlugin: Cosmos.Plugin<any> = async (requestContext, next) => {
  if (isRelevantRequest(requestContext)) {
    const priorityLevel: PriorityLevel = getPriorityLevel();
    requestContext.headers["x-ms-cosmos-priority-level"] = priorityLevel as string;
  }
  return next(requestContext);
};
