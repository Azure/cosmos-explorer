import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { DataAccessUtility } from "../../Platform/Portal/DataAccessUtility";
import { TabsManager } from "./TabsManager";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import DocumentsTab from "./DocumentsTab";
import Explorer from "../Explorer";
import QueryTab from "./QueryTab";

describe("Tabs manager tests", () => {
  let tabsManager: TabsManager;
  let explorer: Explorer;
  let database: ViewModels.Database;
  let collection: ViewModels.Collection;
  let queryTab: QueryTab;
  let documentsTab: DocumentsTab;

  beforeAll(() => {
    explorer = new Explorer({ documentClientUtility: undefined, notificationsClient: undefined, isEmulator: false });
    explorer.databaseAccount = ko.observable<ViewModels.DatabaseAccount>({
      id: "test",
      name: "test",
      location: "",
      type: "",
      kind: "",
      tags: "",
      properties: undefined
    });

    database = {
      container: explorer,
      id: ko.observable<string>("test"),
      isDatabaseShared: () => false
    } as ViewModels.Database;
    database.isDatabaseExpanded = ko.observable<boolean>(true);
    database.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();

    collection = {
      container: explorer,
      databaseId: "test",
      id: ko.observable<string>("test")
    } as ViewModels.Collection;
    collection.getDatabase = (): ViewModels.Database => database;
    collection.isCollectionExpanded = ko.observable<boolean>(true);
    collection.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();

    queryTab = new QueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      collection,
      database,
      title: "",
      tabPath: "",
      documentClientUtility: explorer.documentClientUtility,
      selfLink: "",
      isActive: ko.observable<boolean>(false),
      hashLocation: "",
      onUpdateTabsButtons: undefined
    });

    documentsTab = new DocumentsTab({
      partitionKey: undefined,
      documentIds: ko.observableArray<ViewModels.DocumentId>(),
      tabKind: ViewModels.CollectionTabKind.Documents,
      collection,
      title: "",
      tabPath: "",
      documentClientUtility: new DocumentClientUtilityBase(new DataAccessUtility()),
      selfLink: "",
      hashLocation: "",
      isActive: ko.observable<boolean>(false),
      onUpdateTabsButtons: undefined
    });
  });

  beforeEach(() => {
    tabsManager = new TabsManager();
    explorer.tabsManager = tabsManager;
  });

  it("open new tabs", () => {
    tabsManager.activateNewTab(queryTab);
    expect(tabsManager.openedTabs().length).toBe(1);
    expect(tabsManager.openedTabs()[0]).toEqual(queryTab);
    expect(tabsManager.activeTab()).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);

    tabsManager.activateNewTab(documentsTab);
    expect(tabsManager.openedTabs().length).toBe(2);
    expect(tabsManager.openedTabs()[1]).toEqual(documentsTab);
    expect(tabsManager.activeTab()).toEqual(documentsTab);
    expect(queryTab.isActive()).toBe(false);
    expect(documentsTab.isActive()).toBe(true);
  });

  it("open existing tabs", () => {
    tabsManager.activateNewTab(queryTab);
    tabsManager.activateNewTab(documentsTab);
    tabsManager.activateTab(queryTab);
    expect(tabsManager.openedTabs().length).toBe(2);
    expect(tabsManager.activeTab()).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);
    expect(documentsTab.isActive()).toBe(false);
  });

  it("get tabs", () => {
    tabsManager.activateNewTab(queryTab);
    tabsManager.activateNewTab(documentsTab);

    const queryTabs: ViewModels.Tab[] = tabsManager.getTabs(ViewModels.CollectionTabKind.Query);
    expect(queryTabs.length).toBe(1);
    expect(queryTabs[0]).toEqual(queryTab);

    const documentsTabs: ViewModels.Tab[] = tabsManager.getTabs(
      ViewModels.CollectionTabKind.Documents,
      (tab: ViewModels.Tab) => tab.tabId === documentsTab.tabId
    );
    expect(documentsTabs.length).toBe(1);
    expect(documentsTabs[0]).toEqual(documentsTab);
  });

  it("close tabs", () => {
    tabsManager.activateNewTab(queryTab);
    tabsManager.activateNewTab(documentsTab);

    tabsManager.closeTab(documentsTab.tabId, explorer);
    expect(tabsManager.openedTabs().length).toBe(1);
    expect(tabsManager.openedTabs()[0]).toEqual(queryTab);
    expect(tabsManager.activeTab()).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);
    expect(documentsTab.isActive()).toBe(false);

    tabsManager.closeTabsByComparator((tab: ViewModels.Tab) => tab.tabId === queryTab.tabId);
    expect(tabsManager.openedTabs().length).toBe(0);
    expect(tabsManager.activeTab()).toEqual(undefined);
    expect(queryTab.isActive()).toBe(false);
  });
});
