import * as Constants from "../Common/Constants";
import { LocalStorageUtility, StorageKey } from "./StorageUtility";

export const createDefaultSettings = () => {
  LocalStorageUtility.setEntryNumber(StorageKey.ActualItemPerPage, Constants.Queries.itemsPerPage);
  LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, Constants.Queries.itemsPerPage);
  LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, "true");
  LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, Constants.Queries.DefaultMaxDegreeOfParallelism);
};

export const hasSettingsDefined = (): boolean => {
  return (
    LocalStorageUtility.hasItem(StorageKey.ActualItemPerPage) &&
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled) &&
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
  );
};
