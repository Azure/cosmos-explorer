import * as ViewModels from "../../../Contracts/ViewModels";
import * as DataModels from "../../../Contracts/DataModels";
import { PlatformType } from "../../../PlatformType";
import * as Constants from "../../../Common/Constants";
import * as SharedConstants from "../../../Shared/Constants";
import * as PricingUtils from "../../../Utils/PricingUtils";

import Explorer from "../../Explorer";

export type isDirtyTypes = boolean | string | number | DataModels.IndexingPolicy;

export enum ChangeFeedPolicyState {
  Off = "Off",
  On = "On"
}

export enum TtlType {
  Off = "off",
  On = "on",
  OnNoDefault = "on-nodefault"
}

export enum GeospatialConfigType {
  Geography = "Geography",
  Geometry = "Geometry"
}

export enum SettingsV2TabTypes {
  ScaleTab,
  ConflictResolutionTab,
  SubSettingsTab,
  IndexingPolicyTab
}

export const hasDatabaseSharedThroughput = (collection: ViewModels.Collection): boolean => {
  const database: ViewModels.Database = collection.getDatabase();
  return database?.isDatabaseShared && !collection.offer();
};

export const canThroughputExceedMaximumValue = (collection: ViewModels.Collection, container: Explorer): boolean => {
  const isPublicAzurePortal: boolean =
    container.getPlatformType() === PlatformType.Portal && !container.isRunningOnNationalCloud();
  const hasPartitionKey = !!collection.partitionKey;

  return isPublicAzurePortal && hasPartitionKey;
};

export const getMaxRUs = (collection: ViewModels.Collection, container: Explorer): number => {
  const isTryCosmosDBSubscription = container?.isTryCosmosDBSubscription() || false;
  if (isTryCosmosDBSubscription) {
    return Constants.TryCosmosExperience.maxRU;
  }

  const numPartitionsFromOffer: number =
    collection?.offer && collection.offer()?.content?.collectionThroughputInfo?.numPhysicalPartitions;

  const numPartitionsFromQuotaInfo: number = collection?.quotaInfo().numPartitions;

  const numPartitions = numPartitionsFromOffer || numPartitionsFromQuotaInfo || 1;

  return SharedConstants.CollectionCreation.MaxRUPerPartition * numPartitions;
};

export const getMinRUs = (collection: ViewModels.Collection, container: Explorer): number => {
  const isTryCosmosDBSubscription = container?.isTryCosmosDBSubscription() || false;
  if (isTryCosmosDBSubscription) {
    return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  }

  const offerContent = collection?.offer && collection.offer()?.content;

  if (offerContent?.offerAutopilotSettings) {
    return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  }

  const collectionThroughputInfo: DataModels.OfferThroughputInfo = offerContent?.collectionThroughputInfo;

  if (collectionThroughputInfo?.minimumRUForCollection > 0) {
    return collectionThroughputInfo.minimumRUForCollection;
  }

  const numPartitions = collectionThroughputInfo?.numPhysicalPartitions || collection.quotaInfo().numPartitions;

  if (!numPartitions || numPartitions === 1) {
    return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  }

  const baseRU = SharedConstants.CollectionCreation.DefaultCollectionRUs400;

  const quotaInKb = collection.quotaInfo().collectionSize;
  const quotaInGb = PricingUtils.usageInGB(quotaInKb);

  const perPartitionGBQuota: number = Math.max(10, quotaInGb / numPartitions);
  const baseRUbyPartitions: number = ((numPartitions * perPartitionGBQuota) / 10) * 100;

  return Math.max(baseRU, baseRUbyPartitions);
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
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
};
