import { useState } from "react";
import TabsBase from "../Explorer/Tabs/TabsBase";
import { TabsManager } from "../Explorer/Tabs/TabsManager";
import { useObservable } from "./useObservable";

export type UseTabs = {
  tabs: readonly TabsBase[];
  activeTab: TabsBase;
  tabsManager: TabsManager;
};

export function useTabs(): UseTabs {
  const [tabsManager] = useState(() => new TabsManager());
  const tabs = useObservable(tabsManager.openedTabs);
  const activeTab = useObservable(tabsManager.activeTab);

  return { tabs, activeTab, tabsManager };
}
