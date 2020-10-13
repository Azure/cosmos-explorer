import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import Collection from "../Tree/Collection";
import Database from "../Tree/Database";
import Explorer from "../Explorer";
import SettingsTab from "./SettingsTab";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { IndexingPolicies } from "../../Shared/Constants";

describe("Settings tab", () => {
  const baseCollection: DataModels.Collection = {
    defaultTtl: 200,
    partitionKey: null,
    conflictResolutionPolicy: {
      mode: DataModels.ConflictResolutionMode.LastWriterWins,
      conflictResolutionPath: "/_ts"
    },
    indexingPolicy: IndexingPolicies.SharedDatabaseDefault,
    _rid: "",
    _self: "",
    _etag: "",
    _ts: 0,
    id: "mycoll"
  };

  const baseDatabase: DataModels.Database = {
    _rid: "",
    _self: "",
    _etag: "",
    _ts: 0,
    id: "mydb",
    collections: [baseCollection]
  };

  const quotaInfo: DataModels.CollectionQuotaInfo = {
    storedProcedures: 0,
    triggers: 0,
    functions: 0,
    documentsSize: 0,
    documentsCount: 0,
    collectionSize: 0,
    usageSizeInKB: 0,
    numPartitions: 0
  };

  describe("Conflict Resolution", () => {
    describe("should show conflict resolution", () => {
      let explorer: Explorer;
      const baseCollectionWithoutConflict: DataModels.Collection = {
        defaultTtl: 200,
        partitionKey: null,
        conflictResolutionPolicy: null,
        indexingPolicy: IndexingPolicies.SharedDatabaseDefault,
        _rid: "",
        _self: "",
        _etag: "",
        _ts: 0,
        id: "mycoll"
      };
      const getSettingsTab = (conflictResolution: boolean = true) => {
        return new SettingsTab({
          tabKind: ViewModels.CollectionTabKind.Settings,
          title: "Scale & Settings",
          tabPath: "",
          selfLink: "",
          hashLocation: "",
          isActive: ko.observable(false),
          collection: new Collection(
            explorer,
            "mydb",
            conflictResolution ? baseCollection : baseCollectionWithoutConflict,
            quotaInfo,
            null
          ),
          onUpdateTabsButtons: undefined
        });
      };

      beforeEach(() => {
        explorer = new Explorer();
        explorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      });

      it("single master, should not show conflict resolution", () => {
        const settingsTab = getSettingsTab();
        expect(settingsTab.hasConflictResolution()).toBe(false);
      });

      it("multi master with resolution conflict, show conflict resolution", () => {
        explorer.databaseAccount({
          id: "test",
          kind: "",
          location: "",
          name: "",
          tags: "",
          type: "",
          properties: {
            enableMultipleWriteLocations: true,
            documentEndpoint: "",
            cassandraEndpoint: "",
            gremlinEndpoint: "",
            tableEndpoint: ""
          }
        });

        const settingsTab = getSettingsTab();
        expect(settingsTab.hasConflictResolution()).toBe(true);
      });

      it("multi master without resolution conflict, show conflict resolution", () => {
        explorer.databaseAccount({
          id: "test",
          kind: "",
          location: "",
          name: "",
          tags: "",
          type: "",
          properties: {
            enableMultipleWriteLocations: true,
            documentEndpoint: "",
            cassandraEndpoint: "",
            gremlinEndpoint: "",
            tableEndpoint: ""
          }
        });

        const settingsTab = getSettingsTab(false /* no resolution conflict*/);
        expect(settingsTab.hasConflictResolution()).toBe(false);
      });
    });

    describe("Parse Conflict Resolution Mode from backend", () => {
      it("should parse any casing", () => {
        expect(SettingsTab.parseConflictResolutionMode("custom")).toBe(DataModels.ConflictResolutionMode.Custom);
        expect(SettingsTab.parseConflictResolutionMode("Custom")).toBe(DataModels.ConflictResolutionMode.Custom);
        expect(SettingsTab.parseConflictResolutionMode("lastWriterWins")).toBe(
          DataModels.ConflictResolutionMode.LastWriterWins
        );
        expect(SettingsTab.parseConflictResolutionMode("LastWriterWins")).toBe(
          DataModels.ConflictResolutionMode.LastWriterWins
        );
      });

      it("should parse empty as null", () => {
        expect(SettingsTab.parseConflictResolutionMode("")).toBe(null);
      });

      it("should parse null as null", () => {
        expect(SettingsTab.parseConflictResolutionMode(null)).toBe(null);
      });
    });

    describe("Parse Conflict Resolution procedure from backend", () => {
      it("should parse path as name", () => {
        expect(SettingsTab.parseConflictResolutionProcedure("/dbs/xxxx/colls/xxxx/sprocs/validsproc")).toBe(
          "validsproc"
        );
      });

      it("should parse name as name", () => {
        expect(SettingsTab.parseConflictResolutionProcedure("validsproc")).toBe("validsproc");
      });

      it("should parse invalid path as null", () => {
        expect(SettingsTab.parseConflictResolutionProcedure("/not/a/valid/path")).toBe(null);
      });

      it("should parse empty or null as null", () => {
        expect(SettingsTab.parseConflictResolutionProcedure("")).toBe(null);
        expect(SettingsTab.parseConflictResolutionProcedure(null)).toBe(null);
      });
    });
  });

  describe("Should update collection", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
      explorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
    });

    it("On TTL changed", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.timeToLive("off");
      expect(settingsTab.shouldUpdateCollection()).toBe(true);

      settingsTab.onRevertClick();
      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.timeToLiveSeconds(100);
      expect(settingsTab.shouldUpdateCollection()).toBe(true);
    });

    it("On Index Policy changed", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.indexingPolicyContent({ somethingDifferent: "" });
      expect(settingsTab.shouldUpdateCollection()).toBe(true);
    });

    it("On Conflict Resolution Mode changed", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.Custom);
      expect(settingsTab.shouldUpdateCollection()).toBe(true);

      settingsTab.onRevertClick();
      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.conflictResolutionPolicyPath("/somethingElse");
      expect(settingsTab.shouldUpdateCollection()).toBe(true);

      settingsTab.onRevertClick();
      expect(settingsTab.shouldUpdateCollection()).toBe(false);
      settingsTab.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.Custom);
      settingsTab.conflictResolutionPolicyProcedure("resolver");
      expect(settingsTab.shouldUpdateCollection()).toBe(true);
    });
  });

  describe("Get Conflict Resolution configuration from user", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
      explorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
    });

    it("null if it didnt change", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.getUpdatedConflictResolutionPolicy()).toBe(null);
    });

    it("Custom contains valid backend path", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.getUpdatedConflictResolutionPolicy()).toBe(null);
      settingsTab.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.Custom);
      settingsTab.conflictResolutionPolicyProcedure("resolver");
      let updatedPolicy = settingsTab.getUpdatedConflictResolutionPolicy();
      expect(updatedPolicy.mode).toBe(DataModels.ConflictResolutionMode.Custom);
      expect(updatedPolicy.conflictResolutionProcedure).toBe("/dbs/mydb/colls/mycoll/sprocs/resolver");

      settingsTab.conflictResolutionPolicyProcedure("");
      updatedPolicy = settingsTab.getUpdatedConflictResolutionPolicy();
      expect(updatedPolicy.conflictResolutionProcedure).toBe(undefined);
    });

    it("LWW contains valid property path", () => {
      const settingsTab = new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: new Collection(explorer, "mydb", baseCollection, quotaInfo, null),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });

      expect(settingsTab.getUpdatedConflictResolutionPolicy()).toBe(null);
      settingsTab.conflictResolutionPolicyPath("someAttr");
      let updatedPolicy = settingsTab.getUpdatedConflictResolutionPolicy();
      expect(updatedPolicy.conflictResolutionPath).toBe("/someAttr");

      settingsTab.conflictResolutionPolicyPath("/someAttr");
      updatedPolicy = settingsTab.getUpdatedConflictResolutionPolicy();
      expect(updatedPolicy.conflictResolutionPath).toBe("/someAttr");

      settingsTab.conflictResolutionPolicyPath("");
      updatedPolicy = settingsTab.getUpdatedConflictResolutionPolicy();
      expect(updatedPolicy.conflictResolutionPath).toBe("");
    });
  });

  describe("partitionKeyVisible", () => {
    enum PartitionKeyOption {
      None,
      System,
      NonSystem
    }

    function getCollection(defaultApi: string, partitionKeyOption: PartitionKeyOption) {
      const explorer = new Explorer();
      explorer.defaultExperience(defaultApi);
      explorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);

      const offer: DataModels.Offer = null;
      const defaultTtl = 200;
      const conflictResolutionPolicy = {
        mode: DataModels.ConflictResolutionMode.LastWriterWins,
        conflictResolutionPath: "/_ts"
      };

      return new Collection(
        explorer,
        "mydb",
        {
          defaultTtl: defaultTtl,
          partitionKey:
            partitionKeyOption != PartitionKeyOption.None
              ? {
                  paths: ["/foo"],
                  kind: "Hash",
                  version: 2,
                  systemKey: partitionKeyOption === PartitionKeyOption.System
                }
              : null,
          conflictResolutionPolicy: conflictResolutionPolicy,
          indexingPolicy: IndexingPolicies.SharedDatabaseDefault,
          _rid: "",
          _self: "",
          _etag: "",
          _ts: 0,
          id: "mycoll"
        },
        quotaInfo,
        offer
      );
    }

    function getSettingsTab(defaultApi: string, partitionKeyOption: PartitionKeyOption): SettingsTab {
      return new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: getCollection(defaultApi, partitionKeyOption),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });
    }

    it("on SQL container with no partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.DocumentDB, PartitionKeyOption.None);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Mongo container with no partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.MongoDB, PartitionKeyOption.None);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Gremlin container with no partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Graph, PartitionKeyOption.None);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Cassandra container with no partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Cassandra, PartitionKeyOption.None);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Table container with no partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Table, PartitionKeyOption.None);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on SQL container with system partition key should be true", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.DocumentDB, PartitionKeyOption.System);
      expect(settingsTab.partitionKeyVisible()).toBe(true);
    });

    it("on Mongo container with system partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.MongoDB, PartitionKeyOption.System);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Gremlin container with system partition key should be true", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Graph, PartitionKeyOption.System);
      expect(settingsTab.partitionKeyVisible()).toBe(true);
    });

    it("on Cassandra container with system partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Cassandra, PartitionKeyOption.System);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Table container with system partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Table, PartitionKeyOption.System);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on SQL container with non-system partition key should be true", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.DocumentDB, PartitionKeyOption.NonSystem);
      expect(settingsTab.partitionKeyVisible()).toBe(true);
    });

    it("on Mongo container with non-system partition key should be true", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.MongoDB, PartitionKeyOption.NonSystem);
      expect(settingsTab.partitionKeyVisible()).toBe(true);
    });

    it("on Gremlin container with non-system partition key should be true", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Graph, PartitionKeyOption.NonSystem);
      expect(settingsTab.partitionKeyVisible()).toBe(true);
    });

    it("on Cassandra container with non-system partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Cassandra, PartitionKeyOption.NonSystem);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });

    it("on Table container with non-system partition key should be false", () => {
      const settingsTab = getSettingsTab(Constants.DefaultAccountExperience.Table, PartitionKeyOption.NonSystem);
      expect(settingsTab.partitionKeyVisible()).toBe(false);
    });
  });

  describe("AutoPilot", () => {
    function getCollection(autoPilotTier: DataModels.AutopilotTier) {
      const explorer = new Explorer();
      explorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);

      explorer.databaseAccount({
        id: "test",
        kind: "",
        location: "",
        name: "",
        tags: "",
        type: "",
        properties: {
          enableMultipleWriteLocations: true,
          documentEndpoint: "",
          cassandraEndpoint: "",
          gremlinEndpoint: "",
          tableEndpoint: ""
        }
      });

      const offer: DataModels.Offer = {
        id: "test",
        _etag: "_etag",
        _rid: "_rid",
        _self: "_self",
        _ts: "_ts",
        content: {
          offerThroughput: 0,
          offerIsRUPerMinuteThroughputEnabled: false,
          offerAutopilotSettings: {
            tier: autoPilotTier
          }
        }
      };
      const container: DataModels.Collection = {
        _rid: "_rid",
        _self: "",
        _etag: "",
        _ts: 0,
        id: "mycoll",
        conflictResolutionPolicy: {
          mode: DataModels.ConflictResolutionMode.LastWriterWins,
          conflictResolutionPath: "/_ts"
        }
      };

      return new Collection(explorer, "mydb", container, quotaInfo, offer);
    }

    function getSettingsTab(autoPilotTier: DataModels.AutopilotTier = DataModels.AutopilotTier.Tier1): SettingsTab {
      return new SettingsTab({
        tabKind: ViewModels.CollectionTabKind.Settings,
        title: "Scale & Settings",
        tabPath: "",

        selfLink: "",
        hashLocation: "",
        isActive: ko.observable(false),
        collection: getCollection(autoPilotTier),
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {}
      });
    }
    describe("Visible", () => {
      it("no autopilot configured, should not be visible", () => {
        const settingsTab1 = getSettingsTab(0);
        expect(settingsTab1.isAutoPilotSelected()).toBe(false);

        const settingsTab2 = getSettingsTab(2);
        expect(settingsTab2.isAutoPilotSelected()).toBe(true);
      });
    });

    describe("Autopilot Save", () => {
      it("edit with valid new tier, save should be enabled", () => {
        const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);

        settingsTab.selectedAutoPilotTier(DataModels.AutopilotTier.Tier3);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(true);

        settingsTab.selectedAutoPilotTier(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      });

      it("edit with same tier, save should be disabled", () => {
        const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);

        settingsTab.selectedAutoPilotTier(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      });

      it("edit with invalid tier, save should be disabled", () => {
        const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);

        settingsTab.selectedAutoPilotTier(5);
        expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      });
    });

    describe("Autopilot Discard", () => {
      it("edit tier, discard should be enabled and correctly dicard", () => {
        const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier2);
        expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(false);

        settingsTab.selectedAutoPilotTier(DataModels.AutopilotTier.Tier3);
        expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);

        settingsTab.onRevertClick();
        expect(settingsTab.selectedAutoPilotTier()).toBe(DataModels.AutopilotTier.Tier2);

        settingsTab.selectedAutoPilotTier(0);
        expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);

        settingsTab.onRevertClick();
        expect(settingsTab.selectedAutoPilotTier()).toBe(DataModels.AutopilotTier.Tier2);
      });
    });

    it("On TTL changed", () => {
      const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier1);

      expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      settingsTab.timeToLive("on");
      expect(settingsTab.saveSettingsButton.enabled()).toBe(true);
      expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);
    });

    it("On Index Policy changed", () => {
      const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier1);

      expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      settingsTab.indexingPolicyContent({ somethingDifferent: "" });
      expect(settingsTab.saveSettingsButton.enabled()).toBe(true);
      expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);
    });

    it("On Conflict Resolution Mode changed", () => {
      const settingsTab = getSettingsTab(DataModels.AutopilotTier.Tier1);

      expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      settingsTab.conflictResolutionPolicyPath("/somethingElse");
      expect(settingsTab.saveSettingsButton.enabled()).toBe(true);
      expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);

      settingsTab.onRevertClick();
      expect(settingsTab.saveSettingsButton.enabled()).toBe(false);
      settingsTab.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.Custom);
      settingsTab.conflictResolutionPolicyProcedure("resolver");
      expect(settingsTab.saveSettingsButton.enabled()).toBe(true);
      expect(settingsTab.discardSettingsChangesButton.enabled()).toBe(true);
    });
  });
});
