import * as ko from "knockout";
import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { updateUserContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import DocumentId from "../Tree/DocumentId";
import DocumentsTab from "./DocumentsTab";

describe("Documents tab", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      const documentsTab = new DocumentsTab({
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.buildQuery("")).toContain("select");
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
      const documentsTab = new DocumentsTab({
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be false for null or undefined partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithoutPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be true for non-Mongo accounts with system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.showPartitionKey).toBe(true);
    });

    it("should be false for Mongo accounts with system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: mongoCollectionWithSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be true for non-system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithNonSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        hashLocation: "",
        onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]): void => {},
      });

      expect(documentsTab.showPartitionKey).toBe(true);
    });
  });
});
