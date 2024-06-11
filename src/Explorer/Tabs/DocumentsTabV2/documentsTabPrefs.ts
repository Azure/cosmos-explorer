// Utility functions to manage DocumentsTab preferences

import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";

export interface DocumentsTabPrefs {
  leftPaneWidthPercent: number;
  columnWidths?: number[];
}

const defaultPrefs: DocumentsTabPrefs = {
  leftPaneWidthPercent: 35,
};

export const readDocumentsTabPrefs = (): DocumentsTabPrefs => {
  const prefs = LocalStorageUtility.getEntryObject<DocumentsTabPrefs>(StorageKey.DocumentsTabPrefs);
  return prefs || defaultPrefs;
};

export const saveDocumentsTabPrefs = (prefs: DocumentsTabPrefs): void => {
  LocalStorageUtility.setEntryObject(StorageKey.DocumentsTabPrefs, prefs);
};
