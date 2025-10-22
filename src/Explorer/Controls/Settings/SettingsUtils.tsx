import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { isFabricNative } from "../../../Platform/Fabric/FabricUtil";
import { MongoIndex } from "../../../Utils/arm/generatedClients/cosmos/types";

const zeroValue = 0;
export type isDirtyTypes =
  | boolean
  | string
  | number
  | DataModels.IndexingPolicy
  | DataModels.ComputedProperties
  | DataModels.VectorEmbedding[]
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
      return "Scale";
    case SettingsV2TabTypes.ConflictResolutionTab:
      return "Conflict Resolution";
    case SettingsV2TabTypes.SubSettingsTab:
      return "Settings";
    case SettingsV2TabTypes.IndexingPolicyTab:
      return "Indexing Policy";
    case SettingsV2TabTypes.PartitionKeyTab:
      return isFabricNative() ? "Partition Keys" : "Partition Keys (preview)";
    case SettingsV2TabTypes.ComputedPropertiesTab:
      return "Computed Properties";
    case SettingsV2TabTypes.ContainerVectorPolicyTab:
      return "Container Policies";
    case SettingsV2TabTypes.ThroughputBucketsTab:
      return "Throughput Buckets";
    case SettingsV2TabTypes.GlobalSecondaryIndexTab:
      return "Global Secondary Index (Preview)";
    case SettingsV2TabTypes.DataMaskingTab:
      return "Masking Policy (preview)";
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
};

export const getMongoNotification = (description: string, type: MongoIndexTypes): MongoNotificationMessage => {
  if (description && !type) {
    return {
      type: MongoNotificationType.Warning,
      message: "Please select a type for each index.",
    };
  }

  if (type && (!description || description.trim().length === 0)) {
    return {
      type: MongoNotificationType.Error,
      message: "Please enter a field name.",
    };
  } else if (type === MongoIndexTypes.Wildcard && description?.indexOf("$**") === -1) {
    return {
      type: MongoNotificationType.Error,
      message: "Wildcard path is not present in the field name. Use a pattern like " + MongoWildcardPlaceHolder,
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
  const partitionKeyName = apiType === "Mongo" ? "Shard key" : "Partition key";
  return isLowerCase ? partitionKeyName.toLocaleLowerCase() : partitionKeyName;
};

export const getPartitionKeyTooltipText = (apiType: string): string => {
  if (apiType === "Mongo") {
    return "The shard key (field) is used to split your data across many replica sets (shards) to achieve unlimited scalability. It’s critical to choose a field that will evenly distribute your data.";
  }
  let tooltipText = `The ${getPartitionKeyName(
    apiType,
    true,
  )} is used to automatically distribute data across partitions for scalability. Choose a property in your JSON document that has a wide range of values and evenly distributes request volume.`;
  if (apiType === "SQL") {
    tooltipText += " For small read-heavy workloads or write-heavy workloads of any size, id is often a good choice.";
  }
  return tooltipText;
};

export const getPartitionKeySubtext = (partitionKeyDefault: boolean, apiType: string): string => {
  if (partitionKeyDefault && (apiType === "SQL" || apiType === "Mongo")) {
    const subtext = "For small workloads, the item ID is a suitable choice for the partition key.";
    return subtext;
  }
  return "";
};

export const getPartitionKeyPlaceHolder = (apiType: string, index?: number): string => {
  switch (apiType) {
    case "Mongo":
      return "e.g., categoryId";
    case "Gremlin":
      return "e.g., /address";
    case "SQL":
      return `${
        index === undefined
          ? "Required - first partition key e.g., /TenantId"
          : index === 0
          ? "second partition key e.g., /UserId"
          : "third partition key e.g., /SessionId"
      }`;
    default:
      return "e.g., /address/zipCode";
  }
};
