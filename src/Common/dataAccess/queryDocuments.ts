import { FeedOptions, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import { isVectorSearchEnabled } from "Utils/CapabilityUtils";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Queries } from "../Constants";
import { client } from "../CosmosClient";

export const queryDocuments = (
  databaseId: string,
  containerId: string,
  query: string,
  options: FeedOptions,
): QueryIterator<ItemDefinition & Resource> => {
  options = getCommonQueryOptions(options);
  TelemetryProcessor.trace(Action.ExecuteQuery, ActionModifiers.Submit);
  return client().database(databaseId).container(containerId).items.query(query, options);
};

export const getCommonQueryOptions = (options: FeedOptions): FeedOptions => {
  const storedItemPerPageSetting: number = LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage);
  options = options || {};
  options.populateQueryMetrics = true;
  options.enableScanInQuery = options.enableScanInQuery || true;
  if (!options.partitionKey) {
    options.forceQueryPlan = true;
  }
  options.maxItemCount =
    options.maxItemCount ||
    (storedItemPerPageSetting !== undefined && storedItemPerPageSetting) ||
    Queries.itemsPerPage;
  options.maxDegreeOfParallelism = LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism);
  options.disableNonStreamingOrderByQuery = !isVectorSearchEnabled();
  return options;
};
