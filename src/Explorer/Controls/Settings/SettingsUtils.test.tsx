import ko from "knockout";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import {
  getMongoIndexType,
  getMongoIndexTypeText,
  getMongoNotification,
  getSanitizedInputValue,
  hasDatabaseSharedThroughput,
  isDirty,
  isIndexTransforming,
  MongoIndexTypes,
  MongoNotificationType,
  MongoWildcardPlaceHolder,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure,
  SingleFieldText,
  WildcardText,
} from "./SettingsUtils";
import { collection } from "./TestUtils";

describe("SettingsUtils", () => {
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
        expandDatabase: undefined,
        collapseDatabase: undefined,
        loadCollections: undefined,
        findCollectionWithId: undefined,
        openAddCollection: undefined,
        readSettings: undefined,
        onSettingsClick: undefined,
        loadOffer: undefined,
        getPendingThroughputSplitNotification: undefined,
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
      excludedPaths: [],
    } as DataModels.IndexingPolicy;

    it("works on all types", () => {
      expect(isDirty("baseline", "baseline")).toEqual(false);
      expect(isDirty(0, 0)).toEqual(false);
      expect(isDirty(true, true)).toEqual(false);
      expect(isDirty(undefined, undefined)).toEqual(false);
      expect(isDirty(indexingPolicy, indexingPolicy)).toEqual(false);

      expect(isDirty("baseline", "current")).toEqual(true);
      expect(isDirty(0, 1)).toEqual(true);
      expect(isDirty(true, false)).toEqual(true);
      expect(isDirty(undefined, indexingPolicy)).toEqual(true);
      expect(isDirty(indexingPolicy, { ...indexingPolicy, automatic: false })).toEqual(true);
    });
  });

  it("getSanitizedInputValue", () => {
    const max = 100;
    expect(getSanitizedInputValue("", max)).toEqual(0);
    expect(getSanitizedInputValue("999", max)).toEqual(100);
    expect(getSanitizedInputValue("10", max)).toEqual(10);
  });

  it("getMongoIndexType", () => {
    expect(getMongoIndexType(["Single"])).toEqual(MongoIndexTypes.Single);
    expect(getMongoIndexType(["Wildcard.$**"])).toEqual(MongoIndexTypes.Wildcard);
    expect(getMongoIndexType(["Key1", "Key2"])).toEqual(undefined);
  });

  it("getMongoIndexTypeText", () => {
    expect(getMongoIndexTypeText(MongoIndexTypes.Single)).toEqual(SingleFieldText);
    expect(getMongoIndexTypeText(MongoIndexTypes.Wildcard)).toEqual(WildcardText);
  });

  it("getMongoNotification", () => {
    const singleIndexDescription = "sampleKey";
    const wildcardIndexDescription = "sampleKey.$**";

    let notification = getMongoNotification(singleIndexDescription, undefined);
    expect(notification.message).toEqual("Please select a type for each index.");
    expect(notification.type).toEqual(MongoNotificationType.Warning);

    notification = getMongoNotification(singleIndexDescription, MongoIndexTypes.Single);
    expect(notification).toEqual(undefined);

    notification = getMongoNotification(wildcardIndexDescription, MongoIndexTypes.Wildcard);
    expect(notification).toEqual(undefined);

    notification = getMongoNotification("", MongoIndexTypes.Single);
    expect(notification.message).toEqual("Please enter a field name.");
    expect(notification.type).toEqual(MongoNotificationType.Error);

    notification = getMongoNotification(singleIndexDescription, MongoIndexTypes.Wildcard);
    expect(notification.message).toEqual(
      "Wildcard path is not present in the field name. Use a pattern like " + MongoWildcardPlaceHolder,
    );
    expect(notification.type).toEqual(MongoNotificationType.Error);
  });
});

it("isIndexingTransforming", () => {
  expect(isIndexTransforming(undefined)).toBeFalsy();
  expect(isIndexTransforming(0)).toBeTruthy();
  expect(isIndexTransforming(90)).toBeTruthy();
  expect(isIndexTransforming(100)).toBeFalsy();
});
