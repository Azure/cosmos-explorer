import * as Cosmos from "@azure/cosmos";
import { Constants, PriorityLevel } from "@azure/cosmos";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
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
  const priorityLevel: string = LocalStorageUtility.getEntryString(StorageKey.PriorityLevel);
  if (priorityLevel) {
    return priorityLevel as PriorityLevel;
  } else {
    return PriorityLevel.Low;
  }
}

export const requestPlugin: Cosmos.Plugin<any> = async (requestContext, undefined, next) => {
  if (isRelevantRequest(requestContext)) {
    const priorityLevel: PriorityLevel = getPriorityLevel();
    requestContext.headers[Constants.HttpHeaders.PriorityLevel] = priorityLevel;
  }
  return next(requestContext);
};
