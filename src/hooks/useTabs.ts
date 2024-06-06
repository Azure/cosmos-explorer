import { clamp } from "@fluentui/react";
import { useSelectedNode } from "Explorer/useSelectedNode";
import create, { UseStore } from "zustand";
import * as ViewModels from "../Contracts/ViewModels";
import { CollectionTabKind } from "../Contracts/ViewModels";
import NotebookTabV2 from "../Explorer/Tabs/NotebookV2Tab";
import TabsBase from "../Explorer/Tabs/TabsBase";
import { Platform, configContext } from "./../ConfigContext";

export interface TabsState {
  openedTabs: TabsBase[];
  openedReactTabs: ReactTabKind[];
  activeTab: TabsBase | undefined;
  activeReactTab: ReactTabKind | undefined;
  networkSettingsWarning: string;
  queryCopilotTabInitialInput: string;
  isTabExecuting: boolean;
  isQueryErrorThrown: boolean;
  activateTab: (tab: TabsBase) => void;
  activateNewTab: (tab: TabsBase) => void;
  activateReactTab: (tabkind: ReactTabKind) => void;
  updateTab: (tab: TabsBase) => void;
  getTabs: (tabKind: ViewModels.CollectionTabKind, comparator?: (tab: TabsBase) => boolean) => TabsBase[];
  refreshActiveTab: (comparator: (tab: TabsBase) => boolean) => void;
  closeTabsByComparator: (comparator: (tab: TabsBase) => boolean) => void;
  closeTab: (tab: TabsBase) => void;
  closeAllNotebookTabs: (hardClose: boolean) => void;
  openAndActivateReactTab: (tabKind: ReactTabKind) => void;
  closeReactTab: (tabKind: ReactTabKind) => void;
  setNetworkSettingsWarning: (warningMessage: string) => void;
  setQueryCopilotTabInitialInput: (input: string) => void;
  setIsTabExecuting: (state: boolean) => void;
  setIsQueryErrorThrown: (state: boolean) => void;
  getCurrentTabIndex: () => number;
  selectTabByIndex: (index: number) => void;
  selectLeftTab: () => void;
  selectRightTab: () => void;
  closeActiveTab: () => void;
}

export enum ReactTabKind {
  Connect,
  Home,
  Quickstart,
  QueryCopilot,
}

// HACK: using this const when the configuration context is not initialized yet.
// Since Fabric is always setting the url param, use that instead of the regular config.
const isPlatformFabric = (() => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("platform")) {
    const platform = params.get("platform");
    return platform === Platform.Fabric;
  }
  return false;
})();

export const useTabs: UseStore<TabsState> = create((set, get) => ({
  openedTabs: [],
  openedReactTabs: !isPlatformFabric ? [ReactTabKind.Home] : [],
  activeTab: undefined,
  activeReactTab: !isPlatformFabric ? ReactTabKind.Home : undefined,
  networkSettingsWarning: "",
  queryCopilotTabInitialInput: "",
  isTabExecuting: false,
  isQueryErrorThrown: false,
  activateTab: (tab: TabsBase): void => {
    if (get().openedTabs.some((openedTab) => openedTab.tabId === tab.tabId)) {
      set({ activeTab: tab, activeReactTab: undefined });
      tab.onActivate();
    }
  },
  activateNewTab: (tab: TabsBase): void => {
    set((state) => ({ openedTabs: [...state.openedTabs, tab], activeTab: tab, activeReactTab: undefined }));
    tab.onActivate();
  },
  activateReactTab: (tabKind: ReactTabKind): void => {
    // Clear the selected node when switching to a react tab.
    useSelectedNode.getState().setSelectedNode(undefined);
    set({ activeTab: undefined, activeReactTab: tabKind })
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
    if (updatedTabs.length === 0 && configContext.platform !== Platform.Fabric) {
      set({ activeTab: undefined, activeReactTab: undefined });
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

      if (get().openedTabs.length === 0 && configContext.platform !== Platform.Fabric) {
        set({ activeTab: undefined, activeReactTab: undefined });
      }
    }
  },
  openAndActivateReactTab: (tabKind: ReactTabKind) => {
    if (get().openedReactTabs.indexOf(tabKind) === -1) {
      set((state) => ({
        openedReactTabs: [...state.openedReactTabs, tabKind],
      }));
    }

    set({ activeTab: undefined, activeReactTab: tabKind });
  },
  closeReactTab: (tabKind: ReactTabKind) => {
    const { activeReactTab, openedTabs, openedReactTabs } = get();
    const updatedOpenedReactTabs = openedReactTabs.filter((tab: ReactTabKind) => tabKind !== tab);
    if (activeReactTab === tabKind) {
      openedTabs?.length > 0
        ? set({ activeTab: openedTabs[0], activeReactTab: undefined })
        : set({ activeTab: undefined, activeReactTab: updatedOpenedReactTabs[0] });
    }

    set({ openedReactTabs: updatedOpenedReactTabs });
  },
  setNetworkSettingsWarning: (warningMessage: string) => set({ networkSettingsWarning: warningMessage }),
  setQueryCopilotTabInitialInput: (input: string) => set({ queryCopilotTabInitialInput: input }),
  setIsTabExecuting: (state: boolean) => {
    set({ isTabExecuting: state });
  },
  setIsQueryErrorThrown: (state: boolean) => {
    set({ isQueryErrorThrown: state });
  },
  getCurrentTabIndex: () => {
    const state = get();
    if (state.activeReactTab !== undefined) {
      return state.openedReactTabs.indexOf(state.activeReactTab);
    } else if (state.activeTab !== undefined) {
      const nonReactTabIndex = state.openedTabs.indexOf(state.activeTab);
      if (nonReactTabIndex !== -1) {
        return state.openedReactTabs.length + nonReactTabIndex;
      }
    }

    return -1;
  },
  selectTabByIndex: (index: number) => {
    const state = get();
    const totalTabCount = state.openedReactTabs.length + state.openedTabs.length;
    const clampedIndex = clamp(index, totalTabCount - 1, 0);

    if (clampedIndex < state.openedReactTabs.length) {
      set({ activeTab: undefined, activeReactTab: state.openedReactTabs[clampedIndex] });
    } else {
      set({ activeTab: state.openedTabs[clampedIndex - state.openedReactTabs.length], activeReactTab: undefined });
    }
  },
  selectLeftTab: () => {
    const state = get();
    state.selectTabByIndex(state.getCurrentTabIndex() - 1);
  },
  selectRightTab: () => {
    const state = get();
    state.selectTabByIndex(state.getCurrentTabIndex() + 1);
  },
  closeActiveTab: () => {
    const state = get();
    if (state.activeReactTab !== undefined) {
      state.closeReactTab(state.activeReactTab);
    } else if (state.activeTab !== undefined) {
      state.closeTab(state.activeTab);
    }
  },
}));
