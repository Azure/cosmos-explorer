import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import DocumentsTab from "./DocumentsTab";
import { DataAccessUtility } from "../../Platform/Portal/DataAccessUtility";
import Explorer from "../Explorer";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";

jest.mock("./NotebookTab");

describe("Documents tab", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      const documentsTab = new DocumentsTab({
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.buildQuery("")).toContain("select");
    });
  });

  describe("showPartitionKey", () => {
    const explorer = new Explorer({
      documentClientUtility: null,
      notificationsClient: null,
      isEmulator: false
    });

    const mongoExplorer = new Explorer({
      documentClientUtility: null,
      notificationsClient: null,
      isEmulator: false
    });
    mongoExplorer.defaultExperience(Constants.DefaultAccountExperience.MongoDB);

    const collectionWithoutPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo")
      },
      container: explorer
    });

    const collectionWithSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo")
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true
      },
      container: explorer
    });

    const collectionWithNonSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo")
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: false
      },
      container: explorer
    });

    const mongoCollectionWithSystemPartitionKey = <ViewModels.Collection>(<unknown>{
      id: ko.observable<string>("foo"),
      database: {
        id: ko.observable<string>("foo")
      },
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true
      },
      container: mongoExplorer
    });

    it("should be false for null or undefined collection", () => {
      const documentsTab = new DocumentsTab({
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be false for null or undefined partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithoutPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be true for non-Mongo accounts with system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.showPartitionKey).toBe(true);
    });

    it("should be false for Mongo accounts with system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: mongoCollectionWithSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.showPartitionKey).toBe(false);
    });

    it("should be true for non-system partitionKey", () => {
      const documentsTab = new DocumentsTab({
        collection: collectionWithNonSystemPartitionKey,
        partitionKey: null,
        documentIds: ko.observableArray<ViewModels.DocumentId>(),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "",
        tabPath: "",
        documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
        selfLink: "",
        hashLocation: "",
        isActive: ko.observable<boolean>(false),

        onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
        openedTabs: []
      });

      expect(documentsTab.showPartitionKey).toBe(true);
    });
  });
});
