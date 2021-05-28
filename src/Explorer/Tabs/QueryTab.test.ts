import * as ko from "knockout";
import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { updateUserContext } from "../../UserContext";
import Explorer from "../Explorer";
import QueryTab from "./QueryTab";

describe("Query Tab", () => {
  function getNewQueryTabForContainer(container: Explorer): QueryTab {
    const database = {
      container: container,
      id: ko.observable<string>("test"),
      isDatabaseShared: () => false,
    } as ViewModels.Database;
    const collection = {
      container: container,
      databaseId: "test",
      id: ko.observable<string>("test"),
    } as ViewModels.Collection;

    return new QueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      collection: collection,
      database: database,
      title: "",
      tabPath: "",
      hashLocation: "",
    });
  }

  describe("shouldSetSystemPartitionKeyContainerPartitionKeyValueUndefined", () => {
    const collection = {
      id: ko.observable<string>("withoutsystempk"),
      partitionKey: {
        systemKey: true,
      },
    } as ViewModels.Collection;

    it("no container with system pk, should not set partition key option", () => {
      const iteratorOptions = QueryTab.getIteratorOptions(collection);
      expect(iteratorOptions.initialHeaders).toBeUndefined();
    });
  });

  describe("isQueryMetricsEnabled()", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be true for accounts using SQL API", () => {
      updateUserContext({});
      const queryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.isQueryMetricsEnabled()).toBe(true);
    });

    it("should be false for accounts using other APIs", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableGremlin" }],
          },
        } as DatabaseAccount,
      });
      const queryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.isQueryMetricsEnabled()).toBe(false);
    });
  });

  describe("Save Queries command button", () => {
    let explorer: Explorer;

    beforeEach(() => {
      explorer = new Explorer();
    });

    it("should be visible when using a supported API", () => {
      updateUserContext({});
      const queryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.saveQueryButton.visible()).toBe(true);
    });

    it("should not be visible when using an unsupported API", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableMongo" }],
          },
        } as DatabaseAccount,
      });
      const queryTab = getNewQueryTabForContainer(explorer);
      expect(queryTab.saveQueryButton.visible()).toBe(false);
    });
  });
});
