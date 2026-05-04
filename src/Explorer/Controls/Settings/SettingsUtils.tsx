import { Keys, t } from "Localization";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { isFabricNative } from "../../../Platform/Fabric/FabricUtil";
import { userContext } from "../../../UserContext";
import { isCapabilityEnabled } from "../../../Utils/CapabilityUtils";
import { MongoIndex } from "../../../Utils/arm/generatedClients/cosmos/types";

const zeroValue = 0;
export type isDirtyTypes =
  | boolean
  | string
  | number
  | DataModels.IndexingPolicy
  | DataModels.ComputedProperties
  | DataModels.VectorEmbedding[]
  | DataModels.VectorIndex[]
  | DataModels.FullTextPolicy
  | DataModels.ThroughputBucket[]
  | DataModels.DataMaskingPolicy;
export const TtlOff = "off";
export const TtlOn = "on";
export const TtlOnNoDefault = "on-nodefault";
export const MongoIndexIdField = "_id";
export const MongoWildcardPlaceHolder = "properties.$**";
export const SingleFieldText = "Single Field";
export const WildcardText = "Wildcard";

export enum ChangeFeedPolicyState {
  Off = "Off",
  On = "On",
}

export enum TtlType {
  Off = "off",
  On = "on",
  OnNoDefault = "on-nodefault",
}

export enum GeospatialConfigType {
  Geography = "Geography",
  Geometry = "Geometry",
}

export enum MongoIndexTypes {
  Single = "Single",
  Wildcard = "Wildcard",
}

export interface AddMongoIndexProps {
  mongoIndex: MongoIndex;
  type: MongoIndexTypes;
  notification: MongoNotificationMessage;
}

export enum SettingsV2TabTypes {
  ScaleTab,
  ConflictResolutionTab,
  SubSettingsTab,
  IndexingPolicyTab,
  PartitionKeyTab,
  ComputedPropertiesTab,
  ContainerVectorPolicyTab,
  ThroughputBucketsTab,
  GlobalSecondaryIndexTab,
  DataMaskingTab,
}

export enum ContainerPolicyTabTypes {
  VectorPolicyTab,
  FullTextPolicyTab,
}

export interface IsComponentDirtyResult {
  isSaveable: boolean;
  isDiscardable: boolean;
}

export enum MongoNotificationType {
  Warning = "Warning",
  Error = "Error",
}

export interface MongoNotificationMessage {
  type: MongoNotificationType;
  message: string;
}

export const hasDatabaseSharedThroughput = (collection: ViewModels.Collection): boolean => {
  const database: ViewModels.Database = collection.getDatabase();
  return database?.isDatabaseShared() && !collection.offer();
};

export const isDataMaskingEnabled = (dataMaskingPolicy?: DataModels.DataMaskingPolicy): boolean => {
  const isSqlAccount = userContext.apiType === "SQL";
  if (!isSqlAccount) {
    return false;
  }

  const hasDataMaskingCapability = isCapabilityEnabled(Constants.CapabilityNames.EnableDynamicDataMasking);
  const hasDataMaskingPolicyFromCollection =
    dataMaskingPolicy?.includedPaths?.length > 0 || dataMaskingPolicy?.excludedPaths?.length > 0;

  return hasDataMaskingCapability || hasDataMaskingPolicyFromCollection;
};

export const parseConflictResolutionMode = (modeFromBackend: string): DataModels.ConflictResolutionMode => {
  // Backend can contain different casing as it does case-insensitive comparisson
  if (!modeFromBackend) {
    return undefined;
  }

  const modeAsLowerCase: string = modeFromBackend.toLowerCase();
  if (modeAsLowerCase === DataModels.ConflictResolutionMode.Custom.toLowerCase()) {
    return DataModels.ConflictResolutionMode.Custom;
  }

  // Default is LWW
  return DataModels.ConflictResolutionMode.LastWriterWins;
};

export const parseConflictResolutionProcedure = (procedureFromBackEnd: string): string => {
  // Backend data comes in /dbs/xxxx/colls/xxxx/sprocs/{name}, to make it easier for users, we just use the name
  if (!procedureFromBackEnd) {
    return undefined;
  }

  if (procedureFromBackEnd.indexOf("/") >= 0) {
    const sprocsIndex: number = procedureFromBackEnd.indexOf(Constants.HashRoutePrefixes.sprocHash);
    if (sprocsIndex === -1) {
      return undefined;
    }

    return procedureFromBackEnd.substr(sprocsIndex + Constants.HashRoutePrefixes.sprocHash.length);
  }

  // No path, just a name, in case backend returns just the name
  return procedureFromBackEnd;
};

export const getSanitizedInputValue = (newValueString: string, max?: number): number => {
  const newValue = parseInt(newValueString);
  if (isNaN(newValue)) {
    return zeroValue;
  }
  // make sure new value does not exceed the maximum throughput
  return max ? Math.min(newValue, max) : newValue;
};

export const isDirty = (current: isDirtyTypes, baseline: isDirtyTypes): boolean => {
  const currentType = typeof current;
  const baselineType = typeof baseline;

  if (currentType !== "undefined" && baselineType !== "undefined" && currentType !== baselineType) {
    throw new Error("current and baseline values are not of the same type.");
  }
  const currentStringValue = getStringValue(current, currentType);
  const baselineStringValue = getStringValue(baseline, baselineType);

  return currentStringValue !== baselineStringValue;
};

const getStringValue = (value: isDirtyTypes, type: string): string => {
  switch (type) {
    case "string":
    case "undefined":
    case "number":
    case "boolean":
      return value?.toString();

    default:
      return JSON.stringify(value);
  }
};

export const getTabTitle = (tab: SettingsV2TabTypes): string => {
  switch (tab) {
    case SettingsV2TabTypes.ScaleTab:
      return t(Keys.controls.settings.tabTitles.scale);
    case SettingsV2TabTypes.ConflictResolutionTab:
      return t(Keys.controls.settings.tabTitles.conflictResolution);
    case SettingsV2TabTypes.SubSettingsTab:
      return t(Keys.controls.settings.tabTitles.settings);
    case SettingsV2TabTypes.IndexingPolicyTab:
      return t(Keys.controls.settings.tabTitles.indexingPolicy);
    case SettingsV2TabTypes.PartitionKeyTab:
      return isFabricNative()
        ? t(Keys.controls.settings.tabTitles.partitionKeys)
        : t(Keys.controls.settings.tabTitles.partitionKeysPreview);
    case SettingsV2TabTypes.ComputedPropertiesTab:
      return t(Keys.controls.settings.tabTitles.computedProperties);
    case SettingsV2TabTypes.ContainerVectorPolicyTab:
      return t(Keys.controls.settings.tabTitles.containerPolicies);
    case SettingsV2TabTypes.ThroughputBucketsTab:
      return t(Keys.controls.settings.tabTitles.throughputBuckets);
    case SettingsV2TabTypes.GlobalSecondaryIndexTab:
      return t(Keys.controls.settings.tabTitles.globalSecondaryIndexPreview);
    case SettingsV2TabTypes.DataMaskingTab:
      return t(Keys.controls.settings.tabTitles.maskingPolicyPreview);
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
};

export const getMongoNotification = (description: string, type: MongoIndexTypes): MongoNotificationMessage => {
  if (description && !type) {
    return {
      type: MongoNotificationType.Warning,
      message: t(Keys.controls.settings.mongoNotifications.selectTypeWarning),
    };
  }

  if (type && (!description || description.trim().length === 0)) {
    return {
      type: MongoNotificationType.Error,
      message: t(Keys.controls.settings.mongoNotifications.enterFieldNameError),
    };
  } else if (type === MongoIndexTypes.Wildcard && description?.indexOf("$**") === -1) {
    return {
      type: MongoNotificationType.Error,
      message: t(Keys.controls.settings.mongoNotifications.wildcardPathError) + MongoWildcardPlaceHolder,
    };
  }

  return undefined;
};

export const getMongoIndexType = (keys: string[]): MongoIndexTypes => {
  const length = keys?.length;
  let type: MongoIndexTypes;

  if (length === 1) {
    if (keys[0].indexOf("$**") !== -1) {
      type = MongoIndexTypes.Wildcard;
    } else {
      type = MongoIndexTypes.Single;
    }
  }

  return type;
};

export const getMongoIndexTypeText = (index: MongoIndexTypes): string => {
  if (index === MongoIndexTypes.Single) {
    return SingleFieldText;
  }
  return WildcardText;
};

export const isIndexTransforming = (indexTransformationProgress: number): boolean =>
  // index transformation progress can be 0
  indexTransformationProgress !== undefined && indexTransformationProgress !== 100;

export const getPartitionKeyName = (apiType: string, isLowerCase?: boolean): string => {
  const partitionKeyName =
    apiType === "Mongo"
      ? t(Keys.controls.settings.partitionKey.shardKey)
      : t(Keys.controls.settings.partitionKey.partitionKey);
  return isLowerCase ? partitionKeyName.toLocaleLowerCase() : partitionKeyName;
};

export const getPartitionKeyTooltipText = (apiType: string): string => {
  if (apiType === "Mongo") {
    return t(Keys.controls.settings.partitionKey.shardKeyTooltip);
  }
  let tooltipText = `The ${getPartitionKeyName(apiType, true)} ${t(
    Keys.controls.settings.partitionKey.partitionKeyTooltip,
  )}`;
  if (apiType === "SQL") {
    tooltipText += t(Keys.controls.settings.partitionKey.sqlPartitionKeyTooltipSuffix);
  }
  return tooltipText;
};

export const getPartitionKeySubtext = (partitionKeyDefault: boolean, apiType: string): string => {
  if (partitionKeyDefault && (apiType === "SQL" || apiType === "Mongo")) {
    return t(Keys.controls.settings.partitionKey.partitionKeySubtext);
  }
  return "";
};

export const getPartitionKeyPlaceHolder = (apiType: string, index?: number): string => {
  switch (apiType) {
    case "Mongo":
      return t(Keys.controls.settings.partitionKey.mongoPlaceholder);
    case "Gremlin":
      return t(Keys.controls.settings.partitionKey.gremlinPlaceholder);
    case "SQL":
      return `${
        index === undefined
          ? t(Keys.controls.settings.partitionKey.sqlFirstPartitionKey)
          : index === 0
          ? t(Keys.controls.settings.partitionKey.sqlSecondPartitionKey)
          : t(Keys.controls.settings.partitionKey.sqlThirdPartitionKey)
      }`;
    default:
      return t(Keys.controls.settings.partitionKey.defaultPlaceholder);
  }
};
