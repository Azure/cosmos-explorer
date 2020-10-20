import { collection, container } from "./TestUtils";
import {
  getMaxRUs,
  getMinRUs,
  getMongoIndexType,
  getMongoNotification,
  getSanitizedInputValue,
  hasDatabaseSharedThroughput,
  isDirty,
  isDirtyTypes,
  MongoIndexTypes,
  MongoNotificationType,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure,
  MongoWildcardPlaceHolder
} from "./SettingsUtils";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import ko from "knockout";

describe("SettingsUtils", () => {
  it("getMaxRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMaxRUs(collection, container)).toEqual(40000);
  });

  it("getMinRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMinRUs(collection, container)).toEqual(6000);
  });

  it("hasDatabaseSharedThroughput", () => {
    expect(hasDatabaseSharedThroughput(collection)).toEqual(undefined);

    const newCollection = { ...collection };
    newCollection.getDatabase = () => {
      return {
        nodeKind: undefined,
        rid: undefined,
        container: undefined,
        self: "",
        id: ko.observable(""),
        collections: ko.observableArray(undefined),
        offer: ko.observable(undefined),
        isDatabaseExpanded: ko.observable(false),
        isDatabaseShared: ko.computed(() => true),
        selectedSubnodeKind: ko.observable(undefined),
        selectDatabase: undefined,
        expandDatabase: undefined,
        collapseDatabase: undefined,
        loadCollections: undefined,
        findCollectionWithId: undefined,
        openAddCollection: undefined,
        onDeleteDatabaseContextMenuClick: undefined,
        readSettings: undefined,
        onSettingsClick: undefined,
        loadOffer: undefined
      } as ViewModels.Database;
    };
    newCollection.offer(undefined);
    expect(hasDatabaseSharedThroughput(newCollection)).toEqual(true);
  });

  it("parseConflictResolutionMode", () => {
    expect(parseConflictResolutionMode("custom")).toEqual(DataModels.ConflictResolutionMode.Custom);
    expect(parseConflictResolutionMode("lastwriterwins")).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
  });

  it("parseConflictResolutionProcedure", () => {
    expect(parseConflictResolutionProcedure("/dbs/db/colls/coll/sprocs/conflictResSproc")).toEqual("conflictResSproc");
    expect(parseConflictResolutionProcedure("conflictResSproc")).toEqual("conflictResSproc");
  });

  describe("isDirty", () => {
    const indexingPolicy = {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [],
      excludedPaths: []
    } as DataModels.IndexingPolicy;

    const cases = [
      ["baseline", "current"],
      [0, 1],
      [true, false],
      [undefined, indexingPolicy],
      [indexingPolicy, { ...indexingPolicy, automatic: false }]
    ];

    test.each(cases)("", (baseline: isDirtyTypes, current: isDirtyTypes) => {
      expect(isDirty(baseline, baseline)).toEqual(false);
      expect(isDirty(baseline, current)).toEqual(true);
    });
  });

  it("getSanitizedInputValue", () => {
    const max = 100;
    expect(getSanitizedInputValue("", max)).toEqual(0);
    expect(getSanitizedInputValue("999", max)).toEqual(99);
    expect(getSanitizedInputValue("10", max)).toEqual(10);
  });

  it("getMongoIndexType", () => {
    expect(getMongoIndexType(["Single"])).toEqual(MongoIndexTypes.Single);
    expect(getMongoIndexType(["WildCard.$**"])).toEqual(MongoIndexTypes.WildCard);
    expect(getMongoIndexType(["Key1", "Key2"])).toEqual(undefined);
  });

  it("getMongoNotification", () => {
    const singleIndexDescription = "sampleKey";
    const wildcardIndexDescription = "sampleKey.$**";

    let notification = getMongoNotification(singleIndexDescription, undefined);
    expect(notification.message).toEqual("Please select a type for each index.");
    expect(notification.type).toEqual(MongoNotificationType.Warning);

    notification = getMongoNotification(singleIndexDescription, MongoIndexTypes.Single);
    expect(notification).toEqual(undefined);

    notification = getMongoNotification(wildcardIndexDescription, MongoIndexTypes.WildCard);
    expect(notification).toEqual(undefined);

    notification = getMongoNotification("", MongoIndexTypes.Single);
    expect(notification.message).toEqual("Please enter an index description.");
    expect(notification.type).toEqual(MongoNotificationType.Error);

    notification = getMongoNotification(singleIndexDescription, MongoIndexTypes.WildCard);
    expect(notification.message).toEqual(
      "Wild Card path is not present in the index description. Use a pattern like " + MongoWildcardPlaceHolder
    );
    expect(notification.type).toEqual(MongoNotificationType.Error);
  });
});
