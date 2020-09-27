import { collection, container } from "./TestUtils";
import {
  getMaxRUs,
  getMinRUs,
  hasDatabaseSharedThroughput,
  isDirty,
  isDirtyTypes,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure
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
    const testStatefulValue = (baseline: isDirtyTypes, current: isDirtyTypes) => {
      expect(isDirty(baseline, baseline)).toEqual(false);
      expect(isDirty(baseline, current)).toEqual(true);
    };

    const indexingPolicy = {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [],
      excludedPaths: []
    } as DataModels.IndexingPolicy;

    it("string", () => {
      testStatefulValue("baseline", "current");
    });

    it("number", () => {
      testStatefulValue(0, 1);
    });

    it("boolean", () => {
      testStatefulValue(true, false);
    });

    it("undefined object", () => {
      testStatefulValue(undefined, indexingPolicy);
    });

    it("object", () => {
      testStatefulValue(indexingPolicy, { ...indexingPolicy, automatic: false });
    });
  });
});
