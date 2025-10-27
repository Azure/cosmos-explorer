import ko from "knockout";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import {
  getMongoIndexType,
  getMongoIndexTypeText,
  getMongoNotification,
  getPartitionKeyName,
  getPartitionKeyPlaceHolder,
  getPartitionKeySubtext,
  getPartitionKeyTooltipText,
  getSanitizedInputValue,
  getTabTitle,
  hasDatabaseSharedThroughput,
  isDirty,
  isIndexTransforming,
  MongoIndexTypes,
  MongoNotificationType,
  MongoWildcardPlaceHolder,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure,
  SettingsV2TabTypes,
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
      } as ViewModels.Database;
    };
    newCollection.offer(undefined);
    expect(hasDatabaseSharedThroughput(newCollection)).toEqual(true);
  });

  describe("parseConflictResolutionMode", () => {
    it("parses valid modes correctly", () => {
      expect(parseConflictResolutionMode("custom")).toEqual(DataModels.ConflictResolutionMode.Custom);
      expect(parseConflictResolutionMode("lastwriterwins")).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
      expect(parseConflictResolutionMode("Custom")).toEqual(DataModels.ConflictResolutionMode.Custom);
      expect(parseConflictResolutionMode("CUSTOM")).toEqual(DataModels.ConflictResolutionMode.Custom);
      expect(parseConflictResolutionMode("LastWriterWins")).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
    });

    it("handles empty/undefined input", () => {
      expect(parseConflictResolutionMode(undefined)).toBeUndefined();
      expect(parseConflictResolutionMode(null)).toBeUndefined();
      expect(parseConflictResolutionMode("")).toBeUndefined();
    });

    it("defaults to LastWriterWins for invalid inputs", () => {
      expect(parseConflictResolutionMode("invalid")).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
      expect(parseConflictResolutionMode("123")).toEqual(DataModels.ConflictResolutionMode.LastWriterWins);
    });
  });

  describe("parseConflictResolutionProcedure", () => {
    it("extracts procedure name from valid paths", () => {
      expect(parseConflictResolutionProcedure("/dbs/db/colls/coll/sprocs/conflictResSproc")).toEqual(
        "conflictResSproc",
      );
      expect(parseConflictResolutionProcedure("conflictResSproc")).toEqual("conflictResSproc");
      expect(parseConflictResolutionProcedure("/dbs/mydb/colls/mycoll/sprocs/myProc")).toEqual("myProc");
    });

    it("handles empty/undefined input", () => {
      expect(parseConflictResolutionProcedure(undefined)).toBeUndefined();
      expect(parseConflictResolutionProcedure(null)).toBeUndefined();
      expect(parseConflictResolutionProcedure("")).toBeUndefined();
    });

    it("handles invalid path formats", () => {
      expect(parseConflictResolutionProcedure("/invalid/path")).toBeUndefined();
      expect(parseConflictResolutionProcedure("/dbs/db/colls/coll/wrongtype/name")).toBeUndefined();
    });
  });

  describe("isDirty", () => {
    const indexingPolicy = {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [],
      excludedPaths: [],
    } as DataModels.IndexingPolicy;

    describe("primitive types", () => {
      it("handles strings", () => {
        expect(isDirty("baseline", "baseline")).toBeFalsy();
        expect(isDirty("baseline", "current")).toBeTruthy();
        expect(isDirty("", "")).toBeFalsy();
        expect(isDirty("test", "")).toBeTruthy();
      });

      it("handles numbers", () => {
        expect(isDirty(0, 0)).toBeFalsy();
        expect(isDirty(1, 1)).toBeFalsy();
        expect(isDirty(0, 1)).toBeTruthy();
        expect(isDirty(-1, 1)).toBeTruthy();
      });

      it("handles booleans", () => {
        expect(isDirty(true, true)).toBeFalsy();
        expect(isDirty(false, false)).toBeFalsy();
        expect(isDirty(true, false)).toBeTruthy();
      });

      it("handles undefined and null", () => {
        expect(isDirty(undefined, undefined)).toBeFalsy();
        expect(isDirty(null, null)).toBeFalsy();
        expect(isDirty(undefined, null)).toBeTruthy();
        expect(isDirty(undefined, "value")).toBeTruthy();
      });
    });

    describe("complex types", () => {
      it("handles indexing policy", () => {
        expect(isDirty(indexingPolicy, indexingPolicy)).toBeFalsy();
        expect(isDirty(indexingPolicy, { ...indexingPolicy, automatic: false })).toBeTruthy();
        expect(isDirty(indexingPolicy, { ...indexingPolicy, includedPaths: ["/path"] })).toBeTruthy();
      });

      it("handles array type policies", () => {
        const computedProperties: DataModels.ComputedProperties = [
          { name: "prop1", query: "SELECT * FROM c" },
          { name: "prop2", query: "SELECT * FROM c" },
        ];
        const otherProperties: DataModels.ComputedProperties = [{ name: "prop1", query: "SELECT * FROM c" }];
        expect(isDirty(computedProperties, computedProperties)).toBeFalsy();
        expect(isDirty(computedProperties, otherProperties)).toBeTruthy();
      });
    });

    describe("type mismatch handling", () => {
      it("throws error for mismatched types", () => {
        expect(() => isDirty("string", 123)).toThrow("current and baseline values are not of the same type");
        expect(() => isDirty(true, "true")).toThrow("current and baseline values are not of the same type");
        expect(() => isDirty(0, false)).toThrow("current and baseline values are not of the same type");
      });
    });
  });

  describe("getSanitizedInputValue", () => {
    const max = 100;

    it("handles empty or invalid inputs", () => {
      expect(getSanitizedInputValue("", max)).toEqual(0);
      expect(getSanitizedInputValue("abc", max)).toEqual(0);
      expect(getSanitizedInputValue("!@#", max)).toEqual(0);
      expect(getSanitizedInputValue(null, max)).toEqual(0);
      expect(getSanitizedInputValue(undefined, max)).toEqual(0);
    });

    it("handles valid inputs within max", () => {
      expect(getSanitizedInputValue("10", max)).toEqual(10);
      expect(getSanitizedInputValue("50", max)).toEqual(50);
      expect(getSanitizedInputValue("100", max)).toEqual(100);
    });

    it("handles inputs exceeding max", () => {
      expect(getSanitizedInputValue("101", max)).toEqual(100);
      expect(getSanitizedInputValue("999", max)).toEqual(100);
      expect(getSanitizedInputValue("1000000", max)).toEqual(100);
    });

    it("handles inputs without max constraint", () => {
      expect(getSanitizedInputValue("10")).toEqual(10);
      expect(getSanitizedInputValue("1000")).toEqual(1000);
      expect(getSanitizedInputValue("999999")).toEqual(999999);
    });

    it("handles negative numbers", () => {
      expect(getSanitizedInputValue("-10", max)).toEqual(-10);
      expect(getSanitizedInputValue("-999", max)).toEqual(-999);
    });
  });

  describe("getMongoIndexType", () => {
    it("correctly identifies single field indexes", () => {
      expect(getMongoIndexType(["Single"])).toEqual(MongoIndexTypes.Single);
      expect(getMongoIndexType(["field1"])).toEqual(MongoIndexTypes.Single);
      expect(getMongoIndexType(["name"])).toEqual(MongoIndexTypes.Single);
    });

    it("correctly identifies wildcard indexes", () => {
      expect(getMongoIndexType(["Wildcard.$**"])).toEqual(MongoIndexTypes.Wildcard);
      expect(getMongoIndexType(["field.$**"])).toEqual(MongoIndexTypes.Wildcard);
      expect(getMongoIndexType(["nested.path.$**"])).toEqual(MongoIndexTypes.Wildcard);
    });

    it("returns undefined for invalid or compound indexes", () => {
      expect(getMongoIndexType(["Key1", "Key2"])).toBeUndefined();
      expect(getMongoIndexType([])).toBeUndefined();
      expect(getMongoIndexType(undefined)).toBeUndefined();
    });
  });

  describe("getMongoIndexTypeText", () => {
    it("returns correct text for single field indexes", () => {
      expect(getMongoIndexTypeText(MongoIndexTypes.Single)).toEqual(SingleFieldText);
    });

    it("returns correct text for wildcard indexes", () => {
      expect(getMongoIndexTypeText(MongoIndexTypes.Wildcard)).toEqual(WildcardText);
    });
  });

  describe("getMongoNotification", () => {
    const singleIndexDescription = "sampleKey";
    const wildcardIndexDescription = "sampleKey.$**";

    describe("type validation", () => {
      it("returns warning when type is missing", () => {
        const notification = getMongoNotification(singleIndexDescription, undefined);
        expect(notification.message).toEqual("Please select a type for each index.");
        expect(notification.type).toEqual(MongoNotificationType.Warning);
      });

      it("returns undefined for valid type and description combinations", () => {
        expect(getMongoNotification(singleIndexDescription, MongoIndexTypes.Single)).toBeUndefined();
        expect(getMongoNotification(wildcardIndexDescription, MongoIndexTypes.Wildcard)).toBeUndefined();
      });
    });

    describe("field name validation", () => {
      it("returns error when field name is empty", () => {
        const notification = getMongoNotification("", MongoIndexTypes.Single);
        expect(notification.message).toEqual("Please enter a field name.");
        expect(notification.type).toEqual(MongoNotificationType.Error);

        const whitespaceNotification = getMongoNotification("   ", MongoIndexTypes.Single);
        expect(whitespaceNotification.message).toEqual("Please enter a field name.");
        expect(whitespaceNotification.type).toEqual(MongoNotificationType.Error);
      });

      it("returns error when wildcard index is missing $** pattern", () => {
        const notification = getMongoNotification(singleIndexDescription, MongoIndexTypes.Wildcard);
        expect(notification.message).toEqual(
          "Wildcard path is not present in the field name. Use a pattern like " + MongoWildcardPlaceHolder,
        );
        expect(notification.type).toEqual(MongoNotificationType.Error);
      });
    });

    it("handles undefined field name", () => {
      const notification = getMongoNotification(undefined, MongoIndexTypes.Single);
      expect(notification.message).toEqual("Please enter a field name.");
      expect(notification.type).toEqual(MongoNotificationType.Error);
    });
  });
  it("isIndexingTransforming", () => {
    expect(isIndexTransforming(undefined)).toBeFalsy();
    expect(isIndexTransforming(0)).toBeTruthy();
    expect(isIndexTransforming(90)).toBeTruthy();
    expect(isIndexTransforming(100)).toBeFalsy();
  });

  describe("getTabTitle", () => {
    it("returns correct titles for each tab type", () => {
      expect(getTabTitle(SettingsV2TabTypes.ScaleTab)).toBe("Scale");
      expect(getTabTitle(SettingsV2TabTypes.ConflictResolutionTab)).toBe("Conflict Resolution");
      expect(getTabTitle(SettingsV2TabTypes.SubSettingsTab)).toBe("Settings");
      expect(getTabTitle(SettingsV2TabTypes.IndexingPolicyTab)).toBe("Indexing Policy");
      expect(getTabTitle(SettingsV2TabTypes.ComputedPropertiesTab)).toBe("Computed Properties");
      expect(getTabTitle(SettingsV2TabTypes.ContainerVectorPolicyTab)).toBe("Container Policies");
      expect(getTabTitle(SettingsV2TabTypes.ThroughputBucketsTab)).toBe("Throughput Buckets");
      expect(getTabTitle(SettingsV2TabTypes.DataMaskingTab)).toBe("Masking Policy (preview)");
    });

    it("handles partition key tab title based on fabric native", () => {
      // Assuming initially not fabric native
      expect(getTabTitle(SettingsV2TabTypes.PartitionKeyTab)).toBe("Partition Keys (preview)");
    });

    it("throws error for unknown tab type", () => {
      expect(() => getTabTitle(999 as SettingsV2TabTypes)).toThrow("Unknown tab 999");
    });
  });

  describe("partition key utils", () => {
    it("getPartitionKeyName returns correct name based on API type", () => {
      expect(getPartitionKeyName("Mongo")).toBe("Shard key");
      expect(getPartitionKeyName("SQL")).toBe("Partition key");
      expect(getPartitionKeyName("Mongo", true)).toBe("shard key");
      expect(getPartitionKeyName("SQL", true)).toBe("partition key");
    });

    it("getPartitionKeyTooltipText returns correct tooltip based on API type", () => {
      const mongoTooltip = getPartitionKeyTooltipText("Mongo");
      expect(mongoTooltip).toContain("shard key");
      expect(mongoTooltip).toContain("replica sets");

      const sqlTooltip = getPartitionKeyTooltipText("SQL");
      expect(sqlTooltip).toContain("partition key");
      expect(sqlTooltip).toContain("id is often a good choice");
    });

    it("getPartitionKeySubtext returns correct subtext", () => {
      expect(getPartitionKeySubtext(true, "SQL")).toBe(
        "For small workloads, the item ID is a suitable choice for the partition key.",
      );
      expect(getPartitionKeySubtext(true, "Mongo")).toBe(
        "For small workloads, the item ID is a suitable choice for the partition key.",
      );
      expect(getPartitionKeySubtext(false, "SQL")).toBe("");
      expect(getPartitionKeySubtext(true, "Other")).toBe("");
    });

    it("getPartitionKeyPlaceHolder returns correct placeholder based on API type", () => {
      expect(getPartitionKeyPlaceHolder("Mongo")).toBe("e.g., categoryId");
      expect(getPartitionKeyPlaceHolder("Gremlin")).toBe("e.g., /address");
      expect(getPartitionKeyPlaceHolder("SQL")).toBe("Required - first partition key e.g., /TenantId");
      expect(getPartitionKeyPlaceHolder("SQL", 0)).toBe("second partition key e.g., /UserId");
      expect(getPartitionKeyPlaceHolder("SQL", 1)).toBe("third partition key e.g., /SessionId");
      expect(getPartitionKeyPlaceHolder("Other")).toBe("e.g., /address/zipCode");
    });
  });
});
