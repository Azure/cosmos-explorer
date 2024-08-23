// Definitions of State data

import { deleteState, loadState, saveState, saveStateDebounced } from "Shared/AppStatePersistenceUtility";
import { userContext } from "UserContext";
import * as ViewModels from "../../../Contracts/ViewModels";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";

const componentName = "DocumentsTab";
export enum SubComponentName {
  ColumnSizes = "ColumnSizes",
  FilterHistory = "FilterHistory",
  MainTabDivider = "MainTabDivider",
  ColumnsSelection = "ColumnsSelection",
  ColumnSort = "ColumnSort",
}

export type ColumnSizesMap = { [columnId: string]: WidthDefinition };
export type FilterHistory = string[];
export type WidthDefinition = { idealWidth?: number; minWidth?: number };
export type TabDivider = { leftPaneWidthPercent: number };
export type ColumnsSelection = string[];
export type ColumnSort = { columnId: string; direction: "ascending" | "descending" };

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
  if (!globalAccountName) {
    const message = "Database account name not found in userContext";
    console.error(message);
    TelemetryProcessor.traceFailure(Action.ReadPersistedTabState, { message, componentName });
    return defaultValue;
  }

  const state = loadState({
    componentName: componentName,
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
  if (!globalAccountName) {
    const message = "Database account name not found in userContext";
    console.error(message);
    TelemetryProcessor.traceFailure(Action.SavePersistedTabState, { message, componentName });
    return;
  }

  (debounce ? saveStateDebounced : saveState)(
    {
      componentName: componentName,
      subComponentName,
      globalAccountName,
      databaseName: collection.databaseId,
      containerName: collection.id(),
    },
    state,
  );
};

export const deleteSubComponentState = (subComponentName: SubComponentName, collection: ViewModels.CollectionBase) => {
  const globalAccountName = userContext.databaseAccount?.name;
  if (!globalAccountName) {
    const message = "Database account name not found in userContext";
    console.error(message);
    TelemetryProcessor.traceFailure(Action.DeletePersistedTabState, { message, componentName });
    return;
  }

  deleteState({
    componentName: componentName,
    subComponentName,
    globalAccountName,
    databaseName: collection.databaseId,
    containerName: collection.id(),
  });
};
