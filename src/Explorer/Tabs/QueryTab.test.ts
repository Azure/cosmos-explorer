import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import { CollectionStub, DatabaseStub } from "../../Explorer/OpenActionsStubs";
import QueryTab from "./QueryTab";

describe("Query Tab", () => {
  function getNewQueryTabForContainer(container: ViewModels.Explorer): ViewModels.QueryTab {
    const database: ViewModels.Database = new DatabaseStub({
      container: container,
      id: ko.observable<string>("test"),
      isDatabaseShared: () => false
    });
    const collection: ViewModels.Collection = new CollectionStub({
      container: container,
      databaseId: "test",
      id: ko.observable<string>("test")
    });

    return new QueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      collection: collection,
      database: database,
      title: "",
      tabPath: "",
      documentClientUtility: container.documentClientUtility,
      selfLink: "",
      isActive: ko.observable<boolean>(false),
      hashLocation: "",
      onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {},
      openedTabs: []
    });
  }

  describe("shouldSetSystemPartitionKeyContainerPartitionKeyValueUndefined", () => {
    const collection: ViewModels.Collection = new CollectionStub({
      id: "withoutsystempk",
      partitionKey: {
        systemKey: true
      }
    });

    const collectionSystemPK: ViewModels.Collection = new CollectionStub({
      id: "withsystempk",
      partitionKey: {
        systemKey: true
      }
    });

    it("no container with system pk, should not set partition key option", () => {
      const iteratorOptions = QueryTab.getIteratorOptions(collection);
      expect(iteratorOptions.initialHeaders).toBeUndefined();
    });
  });

  describe("isQueryMetricsEnabled()", () => {
    let explorer: ViewModels.Explorer;

    beforeEach(() => {
      explorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
    });

    it("should be true for accounts using SQL API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.DocumentDB.toLowerCase());
      const queryTab: ViewModels.QueryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.isQueryMetricsEnabled()).toBe(true);
    });

    it("should be false for accounts using other APIs", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.Graph.toLowerCase());
      const queryTab: ViewModels.QueryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.isQueryMetricsEnabled()).toBe(false);
    });
  });

  describe("Save Queries command button", () => {
    let explorer: ViewModels.Explorer;

    beforeEach(() => {
      explorer = new Explorer({ documentClientUtility: null, notificationsClient: null, isEmulator: false });
    });

    it("should be visible when using a supported API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.DocumentDB);
      const queryTab: ViewModels.QueryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.saveQueryButton.visible()).toBe(true);
    });

    it("should not be visible when using an unsupported API", () => {
      explorer.defaultExperience(Constants.DefaultAccountExperience.MongoDB);
      const queryTab: ViewModels.QueryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.saveQueryButton.visible()).toBe(false);
    });
  });
});
