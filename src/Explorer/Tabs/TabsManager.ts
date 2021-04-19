import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";

export class TabsManager {
  public openedTabs = ko.observableArray<TabsBase>([]);
  public activeTab = ko.observable<TabsBase>();

  public activateNewTab(tab: TabsBase): void {
    this.openedTabs.push(tab);
    this.activateTab(tab);
  }

  public activateTab(tab: TabsBase): void {
    if (this.openedTabs().includes(tab)) {
      tab.manager = this;
      this.activeTab(tab);
      tab.onActivate();
    }
  }

  public getTabs(tabKind: ViewModels.CollectionTabKind, comparator?: (tab: TabsBase) => boolean): TabsBase[] {
    return this.openedTabs().filter((tab) => tab.tabKind === tabKind && (!comparator || comparator(tab)));
  }

  public refreshActiveTab(comparator: (tab: TabsBase) => boolean): void {
    // ensures that the tab selects/highlights the right node based on resource tree expand/collapse state
    this.activeTab() && comparator(this.activeTab()) && this.activeTab().onActivate();
  }

  public closeTabsByComparator(comparator: (tab: TabsBase) => boolean): void {
    this.openedTabs()
      .filter(comparator)
      .forEach((tab) => tab.onCloseTabButtonClick());
  }

  public closeTab(tab: TabsBase): void {
    const tabIndex = this.openedTabs().indexOf(tab);
    if (tabIndex !== -1) {
      this.openedTabs.remove(tab);
      tab.manager = undefined;

      if (this.openedTabs().length === 0) {
        this.activeTab(undefined);
      }

      if (tab === this.activeTab()) {
        const tabToTheRight = this.openedTabs()[tabIndex];
        const lastOpenTab = this.openedTabs()[this.openedTabs().length - 1];
        this.activateTab(tabToTheRight ?? lastOpenTab);
      }
    }
  }
}
