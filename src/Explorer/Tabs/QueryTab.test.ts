import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import QueryTab from "./QueryTab";
import { View } from "@nteract/data-explorer/lib/utilities/types";
import { PartitionKey } from "../../Contracts/DataModels";

describe("Query Tab", () => {
  function getNewQueryTabForContainer(container: Explorer): ViewModels.QueryTab {
    const database = {
      container: container,
      id: ko.observable<string>("test"),
      isDatabaseShared: () => false
    } as ViewModels.Database;
    const collection = {
      container: container,
      databaseId: "test",
      id: ko.observable<string>("test")
    } as ViewModels.Collection;

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
      onUpdateTabsButtons: (buttons: ViewModels.NavbarButtonConfig[]): void => {}
    });
  }

  describe("shouldSetSystemPartitionKeyContainerPartitionKeyValueUndefined", () => {
    const collection = {
      id: ko.observable<string>("withoutsystempk"),
      partitionKey: {
        systemKey: true
      }
    } as ViewModels.Collection;

    it("no container with system pk, should not set partition key option", () => {
      const iteratorOptions = QueryTab.getIteratorOptions(collection);
      expect(iteratorOptions.initialHeaders).toBeUndefined();
    });
  });

  describe("isQueryMetricsEnabled()", () => {
    let explorer: Explorer;

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
    let explorer: Explorer;

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
