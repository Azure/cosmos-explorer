import { buildQuery, showPartitionKey } from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import * as ko from "knockout";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";

describe("Documents tab", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      expect(buildQuery(false, "")).toContain("select");
    });
  });

  describe("showPartitionKey", () => {
    const explorer = new Explorer();
    const mongoExplorer = new Explorer();
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableGremlin" }],
        },
      } as DatabaseAccount,
    });

    const collectionWithoutPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo"),
      },
      container: explorer,
    });

    const collectionWithSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo"),
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true,
      },
      container: explorer,
    });

    const collectionWithNonSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo"),
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: false,
      },
      container: explorer,
    });

    const mongoCollectionWithSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo"),
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true,
      },
      container: mongoExplorer,
    });

    it("should be false for null or undefined collection", () => {
      expect(showPartitionKey(undefined, false)).toBe(false);
      expect(showPartitionKey(null, false)).toBe(false);
      expect(showPartitionKey(undefined, true)).toBe(false);
      expect(showPartitionKey(null, true)).toBe(false);
    });

    it("should be false for null or undefined partitionKey", () => {
      expect(showPartitionKey(collectionWithoutPartitionKey, false)).toBe(false);
    });

    it("should be true for non-Mongo accounts with system partitionKey", () => {
      expect(showPartitionKey(collectionWithSystemPartitionKey, false)).toBe(true);
    });

    it("should be false for Mongo accounts with system partitionKey", () => {
      expect(showPartitionKey(mongoCollectionWithSystemPartitionKey, true)).toBe(false);
    });

    it("should be true for non-system partitionKey", () => {
      expect(showPartitionKey(collectionWithNonSystemPartitionKey, false)).toBe(true);
    });
  });
});
