import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";

export function shouldEnableCrossPartitionKey(): boolean {
  return LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true";
}
