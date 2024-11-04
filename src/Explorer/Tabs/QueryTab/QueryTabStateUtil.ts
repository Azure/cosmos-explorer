// Definitions of State data

import { ActionType, OpenQueryTab, TabKind } from "Contracts/ActionContracts";
import {
  AppStateComponentNames,
  readSubComponentState,
  saveSubComponentState,
} from "Shared/AppStatePersistenceUtility";
import * as ViewModels from "../../../Contracts/ViewModels";

export const OPEN_TABS_SUBCOMPONENT_NAME = "OpenTabs";

export const saveQueryTabState = (
  collection: ViewModels.CollectionBase,
  state: {
    queryText: string;
    splitterDirection: "vertical" | "horizontal";
    queryViewSizePercent: number;
  },
  tabIndex: number,
): void => {
  const openTabsState = readSubComponentState<OpenQueryTab[]>(
    AppStateComponentNames.DataExplorerAction,
    OPEN_TABS_SUBCOMPONENT_NAME,
    undefined,
    [],
  );

  openTabsState[tabIndex] = {
    actionType: ActionType.OpenCollectionTab,
    tabKind: TabKind.SQLQuery,
    databaseResourceId: collection.databaseId,
    collectionResourceId: collection.id(),
    query: {
      text: state.queryText,
    },
    splitterDirection: state.splitterDirection,
    queryViewSizePercent: state.queryViewSizePercent,
  };

  saveSubComponentState<OpenQueryTab[]>(
    AppStateComponentNames.DataExplorerAction,
    OPEN_TABS_SUBCOMPONENT_NAME,
    undefined,
    openTabsState,
  );
};

export const deleteQueryTabState = (tabIndex: number): void => {
  const openTabsState = readSubComponentState<OpenQueryTab[]>(
    AppStateComponentNames.DataExplorerAction,
    OPEN_TABS_SUBCOMPONENT_NAME,
    undefined,
    [],
  );

  openTabsState.splice(tabIndex, 1);

  saveSubComponentState<OpenQueryTab[]>(
    AppStateComponentNames.DataExplorerAction,
    OPEN_TABS_SUBCOMPONENT_NAME,
    undefined,
    openTabsState,
  );
};
