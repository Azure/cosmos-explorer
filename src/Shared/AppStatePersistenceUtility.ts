import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";

// The component name whose state is being saved. Component name must not include special characters.
export type ComponentName = "DocumentsTab" | "DocumentsTab.columnSizes";

const SCHEMA_VERSION = 1;
export interface StateData {
  schemaVersion: number;
  timestamp: number;
  data: unknown;
}

type StorePath = {
  componentName: string;
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

  // TODO Add logic to clean up old state data based on timestamp

  LocalStorageUtility.setEntryObject(StorageKey.AppState, appState);
};

// This is for high-frequency state changes
let timeoutId: NodeJS.Timeout | undefined;
export const saveStateDebounced = (path: StorePath, state: unknown, debounceDelayMs = 1000): void => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => saveState(path, state), debounceDelayMs);
};

// Internal stored state
// interface ApplicationState {
//   data: GlobalStateData;
//   globalAccounts: {
//     [globalAccountName: string]: {
//       data: GlobalAccountStateData;
//       databases: {
//         [databaseName: string]: {
//           data: DatabaseStateData;
//           containers: {
//             data: ContainerStateData;
//             [containerName: string]: {
//               [componentName: string]: BaseStateData;
//             };
//           };
//         };
//       };
//     };
//   };
// }

interface ApplicationState {
  [statePath: string]: StateData;
}

/**
 * /componentName/globalAccountName/databaseName/containerName/
 * Any of the path segments can be "" except componentName
 * @param path
 */
const createKeyFromPath = (path: StorePath): string => {
  let key = `/${path.componentName}`;
  ["subComponentName", "globalAccountName", "databaseName", "containerName"].forEach((segment) => {
    const segmentValue = (path as any)[segment];
    key += `/${segmentValue !== undefined ? segmentValue : ""}`;
  });
  return key;
};
