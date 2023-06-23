import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { MongoIndex } from "../../../Utils/arm/generatedClients/cosmos/types";

const zeroValue = 0;
export type isDirtyTypes = boolean | string | number | DataModels.IndexingPolicy | DataModels.ComputedProperties;
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
  ComputedPropertiesTab,
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
    case SettingsV2TabTypes.ComputedPropertiesTab:
      return "Computed Properties";
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
