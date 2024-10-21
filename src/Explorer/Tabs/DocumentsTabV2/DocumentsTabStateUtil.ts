// Definitions of State data

import { ColumnDefinition } from "Explorer/Tabs/DocumentsTabV2/DocumentsTableComponent";
import {
  AppStateComponentNames,
  deleteSubComponentState,
  readSubComponentState,
  saveSubComponentState,
} from "Shared/AppStatePersistenceUtility";
import * as ViewModels from "../../../Contracts/ViewModels";

export enum SubComponentName {
  ColumnSizes = "ColumnSizes",
  FilterHistory = "FilterHistory",
  MainTabDivider = "MainTabDivider",
  ColumnsSelection = "ColumnsSelection",
  ColumnSort = "ColumnSort",
}

export type ColumnSizesMap = { [columnId: string]: WidthDefinition };
export type FilterHistory = string[];
export type WidthDefinition = { widthPx: number };
export type TabDivider = { leftPaneWidthPercent: number };
export type ColumnsSelection = { selectedColumnIds: string[]; columnDefinitions: ColumnDefinition[] };
export type ColumnSort = { columnId: string; direction: "ascending" | "descending" };

// Wrap the ...SubComponentState functions for type safety

export const readDocumentsTabSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  defaultValue: T,
): T => readSubComponentState<T>(AppStateComponentNames.DocumentsTab, subComponentName, collection, defaultValue);

export const saveDocumentsTabSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  state: T,
  debounce?: boolean,
): void => saveSubComponentState<T>(AppStateComponentNames.DocumentsTab, subComponentName, collection, state, debounce);

export const deleteDocumentsTabSubComponentState = (
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
) => deleteSubComponentState(AppStateComponentNames.DocumentsTab, subComponentName, collection);
