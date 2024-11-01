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
export type QueryTexts = string[];

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

/**
 * For a given databaseId-collectionId tuple:
 * Query tab texts are persisted in a form of an array of strings.
 * Each tab's index in the array is determined by the order they are open.
 * If a tab is closed, the array is updated to reflect the new order.
 *
 * We use a map to separate the arrays per databaseId-collectionId tuple.
 * We use a Set for the array to ensure uniqueness of tabId (the set also maintains order of insertion).
 */
export class OpenTabIndexRetriever {
  private openTabsMap: Map<string, Set<string>>;

  constructor() {
    this.openTabsMap = new Map<string, Set<string>>();
  }

  public getOpenTabIndex(databaseId: string, collectionId: string, tabId: string): number {
    const key = `${databaseId}-${collectionId}`;
    const openTabs = this.openTabsMap.get(key);
    if (!openTabs) {
      return -1;
    }

    const openTabArray = Array.from(openTabs);
    return openTabArray.indexOf(tabId);
  }

  public setOpenTabIndex(databaseId: string, collectionId: string, tabId: string): void {
    const key = `${databaseId}-${collectionId}`;
    let openTabs = this.openTabsMap.get(key);
    if (!openTabs) {
      openTabs = new Set<string>();
      this.openTabsMap.set(key, openTabs);
    }

    openTabs.add(tabId);
  }

  public removeOpenTabIndex(databaseId: string, collectionId: string, tabId: string): void {
    const key = `${databaseId}-${collectionId}`;
    const openTabs = this.openTabsMap.get(key);
    if (!openTabs) {
      return;
    }

    openTabs.delete(tabId);
  }
}
