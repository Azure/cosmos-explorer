// Definitions of State data

import {
  AppStateComponentNames,
  deleteSubComponentState,
  readSubComponentState,
  saveSubComponentState,
} from "Shared/AppStatePersistenceUtility";
import * as ViewModels from "../../../Contracts/ViewModels";

export enum SubComponentName {
  SplitterDirection = "SplitterDirection",
  QueryViewSizePercent = "QueryViewSizePercent",
  QueryText = "QueryText",
}

export type QueryViewSizePercent = number;
export type QueryText = string;

// Wrap the ...SubComponentState functions for type safety
export const readQueryTabSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  defaultValue: T,
): T => readSubComponentState<T>(AppStateComponentNames.QueryTab, subComponentName, collection, defaultValue);

export const saveQueryTabSubComponentState = <T>(
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
  state: T,
  debounce?: boolean,
): void => saveSubComponentState<T>(AppStateComponentNames.QueryTab, subComponentName, collection, state, debounce);

export const deleteQueryTabSubComponentState = (
  subComponentName: SubComponentName,
  collection: ViewModels.CollectionBase,
) => deleteSubComponentState(AppStateComponentNames.QueryTab, subComponentName, collection);
