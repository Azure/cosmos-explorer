import * as Constants from "../Common/Constants";
import { LocalStorageUtility, StorageKey } from "./StorageUtility";

export const createDefaultSettings = () => {
  LocalStorageUtility.setEntryNumber(StorageKey.ActualItemPerPage, Constants.Queries.itemsPerPage);
  LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, Constants.Queries.itemsPerPage);
  LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, "true");
  LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, Constants.Queries.DefaultMaxDegreeOfParallelism);
  LocalStorageUtility.setEntryNumber(StorageKey.RetryAttempts, Constants.Queries.DefaultRetryAttempts);
  LocalStorageUtility.setEntryNumber(StorageKey.RetryInterval, Constants.Queries.DefaultRetryIntervalInMs);
  LocalStorageUtility.setEntryNumber(StorageKey.MaxWaitTime, Constants.Queries.DefaultMaxWaitTime);
  LocalStorageUtility.setEntryString(StorageKey.PriorityLevel, Constants.PriorityLevel.Default);
};

export const hasSettingsDefined = (): boolean => {
  return (
    LocalStorageUtility.hasItem(StorageKey.ActualItemPerPage) &&
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled) &&
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism) &&
    LocalStorageUtility.hasItem(StorageKey.RetryAttempts) &&
    LocalStorageUtility.hasItem(StorageKey.RetryInterval) &&
    LocalStorageUtility.hasItem(StorageKey.MaxWaitTime)
  );
};

export const ensurePriorityLevel = () => {
  if (!LocalStorageUtility.hasItem(StorageKey.PriorityLevel)) {
    LocalStorageUtility.setEntryString(StorageKey.PriorityLevel, Constants.PriorityLevel.Default);
  }
};
