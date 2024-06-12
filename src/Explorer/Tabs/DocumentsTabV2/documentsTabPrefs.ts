// Utility functions to manage DocumentsTab preferences

import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";

export interface DocumentsTabPrefs {
  leftPaneWidthPercent: number;
  columnWidths?: { [columnId: string]: number };
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

const DEBOUNCE_TIMEOUT_MS = 300;
let timeoutId: NodeJS.Timeout | undefined;
/**
 * Wait for a short period of time before saving the preferences to avoid too many updates.
 * @param prefs
 */
export const saveDocumentsTabPrefsDebounced = (prefs: DocumentsTabPrefs): void => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => saveDocumentsTabPrefs(prefs), DEBOUNCE_TIMEOUT_MS);
};
