import { MongoGuidRepresentation } from "Common/Constants";
import { SplitterDirection } from "Common/Splitter";
import * as LocalStorageUtility from "./LocalStorageUtility";
import * as SessionStorageUtility from "./SessionStorageUtility";
import * as StringUtility from "./StringUtility";

export { LocalStorageUtility, SessionStorageUtility };
export enum StorageKey {
  ActualItemPerPage,
  DataPlaneRbacEnabled,
  RUThresholdEnabled,
  RUThreshold,
  QueryTimeoutEnabled,
  QueryTimeout,
  RetryAttempts,
  RetryInterval,
  MaxWaitTimeInSeconds,
  AutomaticallyCancelQueryAfterTimeout,
  ContainerPaginationEnabled,
  CopilotSampleDBEnabled,
  CustomItemPerPage,
  DatabaseAccountId,
  EncryptedKeyToken,
  IsCrossPartitionQueryEnabled,
  QueryControlEnabled,
  MaxDegreeOfParellism,
  IsGraphAutoVizDisabled,
  TenantId,
  MostRecentActivity, // deprecated
  SetPartitionKeyUndefined,
  GalleryCalloutDismissed,
  VisitedAccounts,
  PriorityLevel,
  DocumentsTabPrefs,
  DefaultQueryResultsView,
  AppState,
  MongoGuidRepresentation,
  IgnorePartitionKeyOnDocumentUpdate,
}

export const hasRUThresholdBeenConfigured = (): boolean => {
  const ruThresholdEnabledLocalStorageRaw: string | null = LocalStorageUtility.getEntryString(
    StorageKey.RUThresholdEnabled,
  );
  return ruThresholdEnabledLocalStorageRaw === "true" || ruThresholdEnabledLocalStorageRaw === "false";
};

export const ruThresholdEnabled = (): boolean => {
  const ruThresholdEnabledLocalStorageRaw: string | null = LocalStorageUtility.getEntryString(
    StorageKey.RUThresholdEnabled,
  );
  return ruThresholdEnabledLocalStorageRaw === null || StringUtility.toBoolean(ruThresholdEnabledLocalStorageRaw);
};

export const getRUThreshold = (): number => {
  const ruThresholdRaw = LocalStorageUtility.getEntryNumber(StorageKey.RUThreshold);
  if (ruThresholdRaw !== 0) {
    return ruThresholdRaw;
  }
  return DefaultRUThreshold;
};

export const getDefaultQueryResultsView = (): SplitterDirection => {
  const defaultQueryResultsViewRaw = LocalStorageUtility.getEntryString(StorageKey.DefaultQueryResultsView);
  if (defaultQueryResultsViewRaw === SplitterDirection.Vertical) {
    return SplitterDirection.Vertical;
  }
  return SplitterDirection.Horizontal;
};

export const getMongoGuidRepresentation = (): MongoGuidRepresentation => {
  const mongoGuidRepresentation: string | null = LocalStorageUtility.getEntryString(StorageKey.MongoGuidRepresentation);
  if (mongoGuidRepresentation) {
    return mongoGuidRepresentation as MongoGuidRepresentation;
  }

  return MongoGuidRepresentation.CSharpLegacy;
};

export const DefaultRUThreshold = 5000;
