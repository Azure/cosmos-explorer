import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { DocumentsTabV2 } from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import * as ko from "knockout";
import React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { updateUserContext } from "../../UserContext";
import { useTabs } from "../../hooks/useTabs";
import { container } from "../Controls/Settings/TestUtils";
import DocumentId from "../Tree/DocumentId";
import { NewQueryTab } from "./QueryTab/QueryTab";
import { Tabs } from "./Tabs";
import TabsBase from "./TabsBase";

describe("Tab path tooltips", () => {
  const renderActiveTab = () => {
    const tab = Object.assign(
      new TabsBase({ tabKind: ViewModels.CollectionTabKind.Query, title: "Query 1", tabPath: "" }),
      { render: () => React.createElement("button", null, "Execute Query") },
    );
    tab.tabPath = ko.observable("t_34646986695_1_dbc3_1789160465183>testcontainer>Query 1");
    useTabs.setState({ openedTabs: [tab], activeTab: tab });
    return render(React.createElement(Tabs, { explorer: container }));
  };

  beforeEach(() => {
    jest.useFakeTimers();
    useTabs.setState({ openedTabs: [], openedReactTabs: [], activeTab: undefined, activeReactTab: undefined });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
    useTabs.setState({ openedTabs: [], activeTab: undefined });
  });

  it("focuses an activated tab without opening its path tooltip", () => {
    const view = renderActiveTab();
    expect(document.activeElement).toBe(view.getByRole("tab", { name: "Query 1" }));

    act(() => jest.advanceTimersByTime(1000));
    expect(document.querySelector(".ms-Tooltip")).toBeNull();
  });

  it.each(["hover", "focus"])("keeps the path tooltip available on later %s and dismissible with Escape", (trigger) => {
    const view = renderActiveTab();
    const tab = view.getByRole("tab", { name: "Query 1" });
    act(() => jest.advanceTimersByTime(1000));

    if (trigger === "hover") {
      fireEvent.mouseEnter(tab);
    } else {
      act(() => {
        view.getByRole("button", { name: "Execute Query" }).focus();
        tab.focus();
      });
    }

    act(() => jest.advanceTimersByTime(1000));
    expect(document.querySelector(".ms-Tooltip")?.textContent).toContain("testcontainer>Query 1");

    fireEvent.keyDown(tab, { key: "Escape", keyCode: 27, which: 27 });
    expect(document.querySelector(".ms-Tooltip")).toBeNull();
    expect(document.activeElement).toBe(tab);
  });
});

describe("useTabs tests", () => {
  let database: ViewModels.Database;
  let collection: ViewModels.Collection;
  let queryTab: NewQueryTab;
  let documentsTab: DocumentsTabV2;

  beforeEach(() => {
    updateUserContext({
      databaseAccount: {
        id: "test",
        name: "test",
        location: "",
        type: "",
        kind: "",
        properties: undefined,
      },
    });

    database = {
      id: ko.observable<string>("test"),
      isDatabaseShared: () => false,
    } as ViewModels.Database;
    database.isDatabaseExpanded = ko.observable<boolean>(true);
    database.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();

    collection = {
      databaseId: "test",
      id: ko.observable<string>("test"),
    } as ViewModels.Collection;
    collection.getDatabase = (): ViewModels.Database => database;
    collection.isCollectionExpanded = ko.observable<boolean>(true);
    collection.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();

    queryTab = new NewQueryTab(
      {
        tabKind: ViewModels.CollectionTabKind.Query,
        collection,
        database,
        title: "",
        tabPath: "",
        queryText: "",
        partitionKey: collection.partitionKey,
        onLoadStartKey: 1,
      },
      {
        container: container,
      },
    );

    documentsTab = new DocumentsTabV2({
      partitionKey: undefined,
      documentIds: ko.observableArray<DocumentId>(),
      tabKind: ViewModels.CollectionTabKind.Documents,
      collection,
      title: "",
      tabPath: "",
    });

    // make sure tabs have different tabId
    queryTab.tabId = "1";
    documentsTab.tabId = "2";
  });

  beforeEach(() => useTabs.setState({ openedTabs: [], activeTab: undefined }));

  it("open new tabs", () => {
    const { activateNewTab } = useTabs.getState();
    activateNewTab(queryTab);
    let tabsState = useTabs.getState();
    expect(tabsState.openedTabs.length).toBe(1);
    expect(tabsState.openedTabs[0]).toEqual(queryTab);
    expect(tabsState.activeTab).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);

    activateNewTab(documentsTab);
    tabsState = useTabs.getState();
    expect(tabsState.openedTabs.length).toBe(2);
    expect(tabsState.openedTabs[1]).toEqual(documentsTab);
    expect(tabsState.activeTab).toEqual(documentsTab);
    expect(queryTab.isActive()).toBe(false);
    expect(documentsTab.isActive()).toBe(true);
  });

  it("open existing tabs", () => {
    const { activateNewTab, activateTab } = useTabs.getState();
    activateNewTab(queryTab);
    activateNewTab(documentsTab);
    activateTab(queryTab);

    const { openedTabs, activeTab } = useTabs.getState();
    expect(openedTabs.length).toBe(2);
    expect(activeTab).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);
    expect(documentsTab.isActive()).toBe(false);
  });

  it("get tabs", () => {
    const { activateNewTab, getTabs } = useTabs.getState();
    activateNewTab(queryTab);
    activateNewTab(documentsTab);

    const queryTabs = getTabs(ViewModels.CollectionTabKind.Query);
    expect(queryTabs.length).toBe(1);
    expect(queryTabs[0]).toEqual(queryTab);

    const documentsTabs = getTabs(ViewModels.CollectionTabKind.Documents, (tab) => tab.tabId === documentsTab.tabId);
    expect(documentsTabs.length).toBe(1);
    expect(documentsTabs[0]).toEqual(documentsTab);
  });

  it("close tabs", () => {
    const { activateNewTab, closeTab, closeTabsByComparator } = useTabs.getState();
    activateNewTab(queryTab);
    activateNewTab(documentsTab);
    closeTab(documentsTab);

    let tabsState = useTabs.getState();
    expect(tabsState.openedTabs.length).toBe(1);
    expect(tabsState.openedTabs[0]).toEqual(queryTab);
    expect(tabsState.activeTab).toEqual(queryTab);
    expect(queryTab.isActive()).toBe(true);
    expect(documentsTab.isActive()).toBe(false);

    closeTabsByComparator((tab) => tab.tabId === queryTab.tabId);
    tabsState = useTabs.getState();
    expect(tabsState.openedTabs.length).toBe(0);
    expect(tabsState.activeTab).toEqual(undefined);
    expect(queryTab.isActive()).toBe(false);
  });
});
