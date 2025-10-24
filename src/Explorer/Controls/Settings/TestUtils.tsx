import ko from "knockout";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";

export const container = new Explorer();

export const collection = {
  container: container,
  databaseId: "test",
  id: ko.observable<string>("test"),
  defaultTtl: ko.observable<number>(5),
  analyticalStorageTtl: ko.observable<number>(undefined),
  indexingPolicy: ko.observable<DataModels.IndexingPolicy>({
    automatic: true,
    indexingMode: "consistent",
    includedPaths: [],
    excludedPaths: [],
  }),
  rawDataModel: {
    uniqueKeyPolicy: {
      uniqueKeys: [
        {
          paths: ["/id"],
        },
      ],
    },
  },
  usageSizeInKB: ko.observable(100),
  offer: ko.observable<DataModels.Offer>({
    autoscaleMaxThroughput: undefined,
    manualThroughput: 10000,
    minimumThroughput: 6000,
    id: "offer",
    offerReplacePending: false,
  }),
  conflictResolutionPolicy: ko.observable<DataModels.ConflictResolutionPolicy>(
    {} as DataModels.ConflictResolutionPolicy,
  ),
  changeFeedPolicy: ko.observable<DataModels.ChangeFeedPolicy>({} as DataModels.ChangeFeedPolicy),
  geospatialConfig: ko.observable<DataModels.GeospatialConfig>({} as DataModels.GeospatialConfig),
  getDatabase: () => {
    return;
  },
  partitionKey: {
    paths: [],
    kind: "hash",
    version: 2,
  },
  partitionKeyProperties: ["partitionKey"],
  computedProperties: ko.observable<DataModels.ComputedProperties>([
    {
      name: "queryName",
      query: "query",
    },
  ]),
  vectorEmbeddingPolicy: ko.observable<DataModels.VectorEmbeddingPolicy>({} as DataModels.VectorEmbeddingPolicy),
  fullTextPolicy: ko.observable<DataModels.FullTextPolicy>({} as DataModels.FullTextPolicy),
  materializedViews: ko.observable<DataModels.MaterializedView[]>([
    { id: "view1", _rid: "rid1" },
    { id: "view2", _rid: "rid2" },
  ]),
  materializedViewDefinition: ko.observable<DataModels.MaterializedViewDefinition>({
    definition: "SELECT * FROM c WHERE c.id = 1",
    sourceCollectionId: "source1",
    sourceCollectionRid: "rid123",
  }),
  dataMaskingPolicy: ko.observable<DataModels.DataMaskingPolicy>({
    includedPaths: [],
    excludedPaths: ["/excludedPath"],
    policyFormatVersion: 2,
    isPolicyEnabled: true,
  }),
  readSettings: () => {
    return;
  },
} as unknown as ViewModels.Collection;
