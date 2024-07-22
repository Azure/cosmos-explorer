// Definitions of State data

import { TableColumnSizingOptions } from "@fluentui/react-components";
import { loadState, saveState, saveStateDebounced } from "Shared/AppStatePersistenceUtility";
import { userContext } from "UserContext";

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

type ColumnSizesMap = { [columnId: string]: WidthDefinition };
type WidthDefinition = { idealWidth?: number; minWidth?: number };

const defaultSize: WidthDefinition = {
  idealWidth: 200,
  minWidth: 50,
};

const ColumnSizesSubComponentName = "ColumnSizes";
export const readColumnSizes = (
  databaseName: string,
  containerName: string,
  columnIds: string[],
): TableColumnSizingOptions => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  const state = loadState({
    globalAccountName,
    databaseName,
    containerName,
    componentName: ComponentName,
    subComponentName: ColumnSizesSubComponentName,
  }) as ColumnSizesMap;

  const columnSizesPx: ColumnSizesMap = {};
  columnIds.forEach((columnId) => {
    columnSizesPx[columnId] = (state && state[columnId]) || defaultSize;
  });

  return columnSizesPx;
};

export const saveColumnSizes = (databaseName: string, containerName: string, columnSizesMap: ColumnSizesMap): void => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  saveStateDebounced(
    {
      componentName: ComponentName,
      subComponentName: ColumnSizesSubComponentName,
      globalAccountName,
      databaseName,
      containerName,
    },
    columnSizesMap,
  );
};

const filterHistorySubComponentName = "FilterHistory";
export type FilterHistory = string[];
export const readFilterHistory = (databaseName: string, containerName: string): FilterHistory => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  const state = loadState({
    globalAccountName,
    databaseName,
    containerName,
    componentName: ComponentName,
    subComponentName: filterHistorySubComponentName,
  }) as FilterHistory;

  return state || [];
};

export const saveFilterHistory = (databaseName: string, containerName: string, filterHistory: FilterHistory): void => {
  const globalAccountName = userContext.databaseAccount?.name;
  // TODO what if databaseAccount doesn't exist?

  saveState(
    {
      componentName: ComponentName,
      subComponentName: filterHistorySubComponentName,
      globalAccountName,
      databaseName,
      containerName,
    },
    filterHistory,
  );
};
