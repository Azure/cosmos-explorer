import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import TabsBase from "./TabsBase";
import TabsManagerTemplate from "./TabsManager.html";

export class TabsManager {
  public openedTabs: ko.ObservableArray<TabsBase>;
  public activeTab: ko.Observable<TabsBase>;

  constructor() {
    this.openedTabs = ko.observableArray<TabsBase>([]);
    this.activeTab = ko.observable<TabsBase>();
  }

  public activateNewTab(tab: TabsBase): void {
    this.openedTabs.push(tab);
    this.activateTab(tab);
  }

  public activateTab(tab: TabsBase): void {
    this.activeTab() && this.activeTab().isActive(false);
    tab.isActive(true);
    this.activeTab(tab);
  }

  public getTabs(tabKind: ViewModels.CollectionTabKind, comparator?: (tab: TabsBase) => boolean): TabsBase[] {
    return this.openedTabs().filter((openedTab: TabsBase) => {
      return openedTab.tabKind === tabKind && (!comparator || comparator(openedTab));
    });
  }

  public refreshActiveTab(comparator: (tab: TabsBase) => boolean): void {
    // ensures that the tab selects/highlights the right node based on resource tree expand/collapse state
    this.openedTabs().forEach((tab: TabsBase) => {
      if (comparator(tab) && tab.isActive()) {
        tab.onActivate();
      }
    });
  }

  public removeTabById(tabId: string): void {
    this.openedTabs.remove((tab: TabsBase) => tab.tabId === tabId);
  }

  public removeTabByComparator(comparator: (tab: TabsBase) => boolean): void {
    this.openedTabs.remove((tab: TabsBase) => comparator(tab));
  }

  public closeTabsByComparator(comparator: (tab: TabsBase) => boolean): void {
    this.activeTab() && this.activeTab().isActive(false);
    this.activeTab(undefined);
    this.openedTabs().forEach((tab: TabsBase) => {
      if (comparator(tab)) {
        tab.onCloseTabButtonClick();
      }
    });
  }

  public closeTabs(): void {
    this.openedTabs([]);
  }

  public closeTab(tabId: string, explorer: Explorer): void {
    const tabIndex: number = this.openedTabs().findIndex((tab: TabsBase) => tab.tabId === tabId);
    if (tabIndex !== -1) {
      const tabToActive: TabsBase = this.openedTabs()[tabIndex + 1] || this.openedTabs()[tabIndex - 1];
      this.openedTabs()[tabIndex].isActive(false);
      this.removeTabById(tabId);
      if (tabToActive) {
        tabToActive.isActive(true);
        this.activeTab(tabToActive);
      } else {
        explorer.selectedNode(undefined);
        explorer.onUpdateTabsButtons([]);
        this.activeTab(undefined);
      }
    }
  }

  public isTabActive(tabKind: ViewModels.CollectionTabKind): boolean {
    return this.activeTab() && this.activeTab().tabKind === tabKind;
  }
}

function TabsManagerWrapperViewModel(params: { data: TabsManager }) {
  return params.data;
}

export function TabsManagerKOComponent(): unknown {
  return {
    viewModel: TabsManagerWrapperViewModel,
    template: TabsManagerTemplate,
  };
}
