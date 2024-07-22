// Definitions of State data

import { loadState, saveState, saveStateDebounced } from "Shared/AppStatePersistenceUtility";
import { userContext } from "UserContext";
import * as ViewModels from "../../../Contracts/ViewModels";

// Component states
export interface DocumentsTabStateData {
  leftPaneWidthPercent: number;
}

const defaultState: DocumentsTabStateData = {
  leftPaneWidthPercent: 35,
};

const ComponentName = "DocumentsTab";

export const readDocumentsTabState = (): DocumentsTabStateData => {
  const state = loadState({ componentName: ComponentName });
  return (state as DocumentsTabStateData) || defaultState;
};

export const saveDocumentsTabState = (state: DocumentsTabStateData): void => {
  saveStateDebounced({ componentName: ComponentName }, state);
};

export type ColumnSizesMap = { [columnId: string]: WidthDefinition };
export type WidthDefinition = { idealWidth?: number; minWidth?: number };

export const readSubComponentState = <T>(
  subComponentName: "ColumnSizes" | "FilterHistory",
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

export const saveSubComponentState = <T>(
  subComponentName: "ColumnSizes" | "FilterHistory",
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
