import * as LocalStorageUtility from "./LocalStorageUtility";
import * as SessionStorageUtility from "./SessionStorageUtility";

export { LocalStorageUtility, SessionStorageUtility };
export enum StorageKey {
  ActualItemPerPage,
  QueryTimeoutEnabled,
  QueryTimeout,
  RetryAttempts,
  RetryInterval,
  MaxWaitTimeInSeconds,
  AutomaticallyCancelQueryAfterTimeout,
  ContainerPaginationEnabled,
  CustomItemPerPage,
  DatabaseAccountId,
  EncryptedKeyToken,
  IsCrossPartitionQueryEnabled,
  MaxDegreeOfParellism,
  IsGraphAutoVizDisabled,
  TenantId,
  MostRecentActivity,
  SetPartitionKeyUndefined,
  GalleryCalloutDismissed,
  VisitedAccounts,
  PriorityLevel,
}
