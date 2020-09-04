import * as ViewModels from "../../../Contracts/ViewModels";
import * as DataModels from "../../../Contracts/DataModels";
import { PlatformType } from "../../../PlatformType";
import * as Constants from "../../../Common/Constants";
import * as SharedConstants from "../../../Shared/Constants";
import * as PricingUtils from "../../../Utils/PricingUtils";

import Explorer from "../../Explorer";

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

export function hasDatabaseSharedThroughput(collection: ViewModels.Collection): boolean {
  const database: ViewModels.Database = collection.getDatabase();
  return database && database.isDatabaseShared && !collection.offer();
}

export function canThroughputExceedMaximumValue(collection: ViewModels.Collection, container: Explorer): boolean {
  const isPublicAzurePortal: boolean =
    container.getPlatformType() === PlatformType.Portal && !container.isRunningOnNationalCloud();
  const hasPartitionKey = !!collection.partitionKey;

  return isPublicAzurePortal && hasPartitionKey;
}

export function getMaxRUs(collection: ViewModels.Collection, container: Explorer): number {
  const isTryCosmosDBSubscription = (container && container.isTryCosmosDBSubscription()) || false;
  if (isTryCosmosDBSubscription) {
    return Constants.TryCosmosExperience.maxRU;
  }

  const numPartitionsFromOffer: number =
    collection &&
    collection.offer &&
    collection.offer() &&
    collection.offer().content &&
    collection.offer().content.collectionThroughputInfo &&
    collection.offer().content.collectionThroughputInfo.numPhysicalPartitions;

  const numPartitionsFromQuotaInfo: number = collection && collection.quotaInfo().numPartitions;

  const numPartitions = numPartitionsFromOffer || numPartitionsFromQuotaInfo || 1;

  return SharedConstants.CollectionCreation.MaxRUPerPartition * numPartitions;
}

export function getMinRUs(collection: ViewModels.Collection, container: Explorer): number {
  const isTryCosmosDBSubscription = (container && container.isTryCosmosDBSubscription()) || false;
  if (isTryCosmosDBSubscription) {
    return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  }

  const offerContent = collection && collection.offer && collection.offer() && collection.offer().content;

  if (offerContent && offerContent.offerAutopilotSettings) {
    return 400;
  }

  const collectionThroughputInfo: DataModels.OfferThroughputInfo =
    offerContent && offerContent.collectionThroughputInfo;

  if (
    collectionThroughputInfo &&
    collectionThroughputInfo.minimumRUForCollection &&
    collectionThroughputInfo.minimumRUForCollection > 0
  ) {
    return collectionThroughputInfo.minimumRUForCollection;
  }

  const numPartitions =
    (collectionThroughputInfo && collectionThroughputInfo.numPhysicalPartitions) ||
    collection.quotaInfo().numPartitions;

  if (!numPartitions || numPartitions === 1) {
    return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  }

  const baseRU = SharedConstants.CollectionCreation.DefaultCollectionRUs400;

  const quotaInKb = collection.quotaInfo().collectionSize;
  const quotaInGb = PricingUtils.usageInGB(quotaInKb);

  const perPartitionGBQuota: number = Math.max(10, quotaInGb / numPartitions);
  const baseRUbyPartitions: number = ((numPartitions * perPartitionGBQuota) / 10) * 100;

  return Math.max(baseRU, baseRUbyPartitions);
}

export function getTabTitle(tab: SettingsV2TabTypes): string {
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
}
