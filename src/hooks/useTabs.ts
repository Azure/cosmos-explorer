import { useState } from "react";
import TabsBase from "../Explorer/Tabs/TabsBase";
import { TabsManager } from "../Explorer/Tabs/TabsManager";
import { useObservableState } from "./useObservableState";

export type UseTabs = {
  tabs: readonly TabsBase[];
  tabsManager: TabsManager;
};

export function useTabs(): UseTabs {
  const [tabsManager] = useState(() => new TabsManager());
  const [tabs] = useObservableState(tabsManager.openedTabs);

  return { tabs, tabsManager };
}
