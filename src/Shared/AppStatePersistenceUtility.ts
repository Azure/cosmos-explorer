import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import * as ViewModels from "../Contracts/ViewModels";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";

// The component name whose state is being saved. Component name must not include special characters.
export enum AppStateComponentNames {
  DocumentsTab = "DocumentsTab",
  MostRecentActivity = "MostRecentActivity",
  QueryCopilot = "QueryCopilot",
  DataExplorerAction = "DataExplorerAction",
}

export const PATH_SEPARATOR = "/"; // export for testing purposes
const SCHEMA_VERSION = 1;

// Export for testing purposes
export const MAX_ENTRY_NB = 100_000; // Limit number of entries to 100k

export interface StateData {
  schemaVersion: number;
  timestamp: number;
  data: unknown;
}

// Export for testing purposes
export type StorePath = {
  componentName: AppStateComponentNames;
  subComponentName?: string;
  globalAccountName?: string;
  databaseName?: string;
  containerName?: string;
};

// Load and save state data
export const loadState = (path: StorePath): unknown => {
  const appState =
    LocalStorageUtility.getEntryObject<ApplicationState>(StorageKey.AppState) || ({} as ApplicationState);
  const key = createKeyFromPath(path);
  return appState[key]?.data;
};

export const saveState = (path: StorePath, state: unknown): void => {
  // Retrieve state object
  const appState =
    LocalStorageUtility.getEntryObject<ApplicationState>(StorageKey.AppState) || ({} as ApplicationState);
  const key = createKeyFromPath(path);
  appState[key] = {
    schemaVersion: SCHEMA_VERSION,
    timestamp: Date.now(),
    data: state,
  };

  if (Object.keys(appState).length > MAX_ENTRY_NB) {
    // Remove the oldest entry
    const oldestKey = Object.keys(appState).reduce((oldest, current) =>
      appState[current].timestamp < appState[oldest].timestamp ? current : oldest,
    );
    delete appState[oldestKey];
  }

  LocalStorageUtility.setEntryObject(StorageKey.AppState, appState);
};

export const deleteState = (path: StorePath): void => {
  // Retrieve state object
  const appState =
    LocalStorageUtility.getEntryObject<ApplicationState>(StorageKey.AppState) || ({} as ApplicationState);
  const key = createKeyFromPath(path);
  delete appState[key];
  LocalStorageUtility.setEntryObject(StorageKey.AppState, appState);
};

export const hasState = (path: StorePath): boolean => {
  return loadState(path) !== undefined;
};

// This is for high-frequency state changes
// Keep track of timeouts per path
const pathToTimeoutIdMap = new Map<string, NodeJS.Timeout>();
export const saveStateDebounced = (path: StorePath, state: unknown, debounceDelayMs = 1000): void => {
  const key = createKeyFromPath(path);
  const timeoutId = pathToTimeoutIdMap.get(key);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  pathToTimeoutIdMap.set(
    key,
    setTimeout(() => saveState(path, state), debounceDelayMs),
  );
};

interface ApplicationState {
  [statePath: string]: StateData;
}

const orderedPathSegments: (keyof StorePath)[] = [
  "subComponentName",
  "globalAccountName",
  "databaseName",
  "containerName",
];

/**
 * /componentName/subComponentName/globalAccountName/databaseName/containerName/
 * Any of the path segments can be "" except componentName
 * Export for testing purposes
 * @param path
 */
export const createKeyFromPath = (path: StorePath): string => {
  let key = `${PATH_SEPARATOR}${encodeURIComponent(path.componentName)}`; // ComponentName is always there
  orderedPathSegments.forEach((segment) => {
    const segmentValue = path[segment as keyof StorePath];
    key += `${PATH_SEPARATOR}${segmentValue !== undefined ? encodeURIComponent(segmentValue) : ""}`;
  });
  return key;
};

/**
 * Remove the entire app state key from local storage
 */
export const deleteAllStates = (): void => {
  LocalStorageUtility.removeEntry(StorageKey.AppState);
};

// Convenience functions

/**
 *
 * @param subComponentName
 * @param collection
 * @param defaultValue Will be returned if persisted state is not found
 * @returns
 */
export const readSubComponentState = <T>(
  componentName: AppStateComponentNames,
  subComponentName: string,
  collection: ViewModels.CollectionBase | undefined,
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
    databaseName: collection ? collection.databaseId : "",
    containerName: collection ? collection.id() : "",
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
  componentName: AppStateComponentNames,
  subComponentName: string,
  collection: ViewModels.CollectionBase | undefined,
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
      databaseName: collection ? collection.databaseId : "",
      containerName: collection ? collection.id() : "",
    },
    state,
  );
};

export const deleteSubComponentState = (
  componentName: AppStateComponentNames,
  subComponentName: string,
  collection: ViewModels.CollectionBase,
) => {
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
