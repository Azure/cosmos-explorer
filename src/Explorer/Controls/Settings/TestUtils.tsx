import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import ko from "knockout";

export const container = new Explorer();

export const collection = ({
  container: container,
  databaseId: "test",
  id: ko.observable<string>("test"),
  defaultTtl: ko.observable<number>(5),
  analyticalStorageTtl: ko.observable<number>(undefined),
  indexingPolicy: ko.observable<DataModels.IndexingPolicy>({
    automatic: true,
    indexingMode: "default",
    includedPaths: [],
    excludedPaths: []
  }),
  uniqueKeyPolicy: {} as DataModels.UniqueKeyPolicy,
  quotaInfo: ko.observable<DataModels.CollectionQuotaInfo>({} as DataModels.CollectionQuotaInfo),
  offer: ko.observable<DataModels.Offer>({
    autoscaleMaxThroughput: undefined,
    manualThroughput: 10000,
    minimumThroughput: 6000,
    id: "offer"
  }),
  conflictResolutionPolicy: ko.observable<DataModels.ConflictResolutionPolicy>(
    {} as DataModels.ConflictResolutionPolicy
  ),
  changeFeedPolicy: ko.observable<DataModels.ChangeFeedPolicy>({} as DataModels.ChangeFeedPolicy),
  geospatialConfig: ko.observable<DataModels.GeospatialConfig>({} as DataModels.GeospatialConfig),
  getDatabase: () => {
    return;
  },
  partitionKey: {
    paths: [],
    kind: "hash",
    version: 2
  },
  partitionKeyProperty: "partitionKey",
  readSettings: () => {
    return;
  }
} as unknown) as ViewModels.Collection;
