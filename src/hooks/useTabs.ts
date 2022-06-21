import create, { UseStore } from "zustand";
import * as ViewModels from "../Contracts/ViewModels";
import { CollectionTabKind } from "../Contracts/ViewModels";
import NotebookTabV2 from "../Explorer/Tabs/NotebookV2Tab";
import TabsBase from "../Explorer/Tabs/TabsBase";

interface TabsState {
  openedTabs: TabsBase[];
  activeTab: TabsBase;
  isConnectTabOpen: boolean;
  isConnectTabActive: boolean;
  activateTab: (tab: TabsBase) => void;
  activateNewTab: (tab: TabsBase) => void;
  updateTab: (tab: TabsBase) => void;
  getTabs: (tabKind: ViewModels.CollectionTabKind, comparator?: (tab: TabsBase) => boolean) => TabsBase[];
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void;
  closeTabsByComparator: (comparator: (tab: TabsBase) => boolean) => void;
  closeTab: (tab: TabsBase) => void;
  closeAllNotebookTabs: (hardClose: boolean) => void;
  activateConnectTab: () => void;
  openAndActivateConnectTab: () => void;
  closeConnectTab: () => void;
}

export const useTabs: UseStore<TabsState> = create((set, get) => ({
  openedTabs: [],
  activeTab: undefined,
  isConnectTabOpen: false,
  isConnectTabActive: false,
  activateTab: (tab: TabsBase): void => {
    if (get().openedTabs.some((openedTab) => openedTab.tabId === tab.tabId)) {
      set({ activeTab: tab, isConnectTabActive: false });
      tab.onActivate();
    }
  },
  activateNewTab: (tab: TabsBase): void => {
    set((state) => ({ openedTabs: [...state.openedTabs, tab], activeTab: tab, isConnectTabActive: false }));
    tab.onActivate();
  },
  updateTab: (tab: TabsBase) => {
    if (get().activeTab?.tabId === tab.tabId) {
      set({ activeTab: tab });
    }

    set((state) => ({
      openedTabs: state.openedTabs.map((openedTab) => {
        if (openedTab.tabId === tab.tabId) {
          return tab;
        }
        return openedTab;
      }),
    }));
  },
  getTabs: (tabKind: ViewModels.CollectionTabKind, comparator?: (tab: TabsBase) => boolean): TabsBase[] =>
    get().openedTabs.filter((tab) => tab.tabKind === tabKind && (!comparator || comparator(tab))),
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean): void => {
    // ensures that the tab selects/highlights the right node based on resource tree expand/collapse state
    const activeTab = get().activeTab;
    activeTab && comparator(activeTab) && activeTab.onActivate();
  },
  closeTabsByComparator: (comparator: (tab: TabsBase) => boolean): void =>
    get()
      .openedTabs.filter(comparator)
      .forEach((tab) => tab.onCloseTabButtonClick()),
  closeTab: (tab: TabsBase): void => {
    let tabIndex: number;
    const { activeTab, openedTabs } = get();
    const updatedTabs = openedTabs.filter((openedTab, index) => {
      if (tab.tabId === openedTab.tabId) {
        tabIndex = index;
        return false;
      }
      return true;
    });
    if (updatedTabs.length === 0) {
      set({ activeTab: undefined, isConnectTabActive: get().isConnectTabOpen });
    }

    if (tab.tabId === activeTab.tabId && tabIndex !== -1) {
      const tabToTheRight = updatedTabs[tabIndex];
      const lastOpenTab = updatedTabs[updatedTabs.length - 1];
      const newActiveTab = tabToTheRight ?? lastOpenTab;
      set({ activeTab: newActiveTab });
      if (newActiveTab) {
        newActiveTab.onActivate();
      }
    }

    set({ openedTabs: updatedTabs });
  },
  closeAllNotebookTabs: (hardClose): void => {
    const isNotebook = (tabKind: CollectionTabKind): boolean => {
      if (
        tabKind === CollectionTabKind.Notebook ||
        tabKind === CollectionTabKind.NotebookV2 ||
        tabKind === CollectionTabKind.SchemaAnalyzer ||
        tabKind === CollectionTabKind.Terminal
      ) {
        return true;
      }
      return false;
    };

    const tabList = get().openedTabs;
    if (tabList && tabList.length > 0) {
      tabList.forEach((tab: NotebookTabV2) => {
        const tabKind: CollectionTabKind = tab.tabKind;
        if (tabKind && isNotebook(tabKind)) {
          tab.onCloseTabButtonClick(hardClose);
        }
      });

      if (get().openedTabs.length === 0) {
        set({ activeTab: undefined, isConnectTabActive: get().isConnectTabOpen });
      }
    }
  },
  activateConnectTab: () => {
    if (get().isConnectTabOpen) {
      set({ isConnectTabActive: true, activeTab: undefined });
    }
  },
  openAndActivateConnectTab: () => set({ isConnectTabActive: true, isConnectTabOpen: true, activeTab: undefined }),
  closeConnectTab: () => {
    const { isConnectTabActive, openedTabs } = get();
    if (isConnectTabActive && openedTabs?.length > 0) {
      set({ activeTab: openedTabs[0] });
    }
    set({ isConnectTabActive: false, isConnectTabOpen: false });
  },
}));
