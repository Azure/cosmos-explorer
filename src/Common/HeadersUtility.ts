import { RetryOptions } from "@azure/cosmos";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";

export function shouldEnableCrossPartitionKey(): boolean {
  return LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true";
}

export function getQueryRetryOptions(): RetryOptions {
  const retrySettings = {
    maxRetryAttemptCount: LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts),
    fixedRetryIntervalInMilliseconds: LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval),
    maxWaitTimeInSeconds: LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTime),
  };
  return retrySettings;
}
