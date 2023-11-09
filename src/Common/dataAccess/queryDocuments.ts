import { FeedOptions, ItemDefinition, QueryIterator, Resource, RetryOptions } from "@azure/cosmos";
import { LocalStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { Queries } from "../Constants";
import { client } from "../CosmosClient";

export const queryDocuments = (
  databaseId: string,
  containerId: string,
  query: string,
  options: FeedOptions,
  retrySettings: RetryOptions,
): QueryIterator<ItemDefinition & Resource> => {
  options = getCommonQueryOptions(options, retrySettings);
  return client().database(databaseId).container(containerId).items.query(query, options);
};

export const getCommonQueryOptions = (options: FeedOptions, retrySettings: RetryOptions): FeedOptions => {
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
  retrySettings.maxRetryAttemptCount = LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts);
  retrySettings.fixedRetryIntervalInMilliseconds = LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval);
  retrySettings.maxWaitTimeInSeconds = LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTime);
  return options;
};
