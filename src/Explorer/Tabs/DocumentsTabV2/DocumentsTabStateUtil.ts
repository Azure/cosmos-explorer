// Definitions of State data

import { loadState, saveState, saveStateDebounced } from "Shared/AppStatePersistenceUtility";
import { userContext } from "UserContext";
import * as ViewModels from "../../../Contracts/ViewModels";

const ComponentName = "DocumentsTab";
export type SubComponentName = "ColumnSizes" | "FilterHistory" | "MainTabDivider";

export type ColumnSizesMap = { [columnId: string]: WidthDefinition };
export type WidthDefinition = { idealWidth?: number; minWidth?: number };
export type TabDivider = { leftPaneWidthPercent: number };

/**
 *
 * @param subComponentName
 * @param collection
 * @param defaultValue Will be returned if persisted state is not found
 * @returns
 */
export const readSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  defaultValue: T,
): T => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  const state = loadState({
    componentName: ComponentName,
    subComponentName,
    globalAccountName,
    databaseName: collection.databaseId,
    containerName: collection.id(),
  }) as T;

  return state || defaultValue;
};

/**
 *
 * @param subComponentName
 * @param collection
 * @param state State to save
 * @param debounce true for high-frequency calls (e.g mouse drag events)
 */
export const saveSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  state: T,
  debounce?: boolean,
): void => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  (debounce ? saveStateDebounced : saveState)(
    {
      componentName: ComponentName,
      subComponentName,
      globalAccountName,
      databaseName: collection.databaseId,
      containerName: collection.id(),
    },
    state,
  );
};
