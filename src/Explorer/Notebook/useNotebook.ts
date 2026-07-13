import { cloneDeep } from "lodash";
import create, { UseStore } from "zustand";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { ConnectionStatusType } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { ContainerConnectionInfo, ContainerInfo } from "../../Contracts/DataModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { useTabs } from "../../hooks/useTabs";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";

interface NotebookState {
  isNotebookEnabled: boolean;
  isNotebooksEnabledForAccount: boolean;
  notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo;
  sparkClusterConnectionInfo: DataModels.SparkClusterConnectionInfo;
  isSynapseLinkUpdating: boolean;
  memoryUsageInfo: DataModels.MemoryUsageInfo;
  isShellEnabled: boolean;
  notebookBasePath: string;
  isInitializingNotebooks: boolean;
  myNotebooksContentRoot: NotebookContentItem;
  galleryContentRoot: NotebookContentItem;
  connectionInfo: ContainerConnectionInfo;
  notebookFolderName: string;
  isAllocating: boolean;
  isRefreshed: boolean;
  containerStatus: ContainerInfo;
  isPhoenixNotebooks: boolean;
  isPhoenixFeatures: boolean;
  setIsNotebookEnabled: (isNotebookEnabled: boolean) => void;
  setIsNotebooksEnabledForAccount: (isNotebooksEnabledForAccount: boolean) => void;
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => void;
  setSparkClusterConnectionInfo: (sparkClusterConnectionInfo: DataModels.SparkClusterConnectionInfo) => void;
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => void;
  setMemoryUsageInfo: (memoryUsageInfo: DataModels.MemoryUsageInfo) => void;
  setIsShellEnabled: (isShellEnabled: boolean) => void;
  setNotebookBasePath: (notebookBasePath: string) => void;
  setNotebookFolderName: (notebookFolderName: string) => void;
  refreshNotebooksEnabledStateForAccount: () => Promise<void>;
  findItem: (root: NotebookContentItem, item: NotebookContentItem) => NotebookContentItem;
  insertNotebookItem: (parent: NotebookContentItem, item: NotebookContentItem) => void;
  updateNotebookItem: (item: NotebookContentItem) => void;
  deleteNotebookItem: (item: NotebookContentItem) => void;
  initializeNotebooksTree: () => Promise<void>;
  setConnectionInfo: (connectionInfo: ContainerConnectionInfo) => void;
  setIsAllocating: (isAllocating: boolean) => void;
  resetContainerConnection: (connectionStatus: ContainerConnectionInfo) => void;
  setIsRefreshed: (isAllocating: boolean) => void;
  setContainerStatus: (containerStatus: ContainerInfo) => void;
  getPhoenixStatus: () => Promise<void>;
  setIsPhoenixNotebooks: (isPhoenixNotebooks: boolean) => void;
  setIsPhoenixFeatures: (isPhoenixFeatures: boolean) => void;
}

export const useNotebook: UseStore<NotebookState> = create((set, get) => ({
  isNotebookEnabled: false,
  isNotebooksEnabledForAccount: false,
  notebookServerInfo: {
    notebookServerEndpoint: undefined,
    authToken: undefined,
    forwardingId: undefined,
  },
  sparkClusterConnectionInfo: {
    userName: undefined,
    password: undefined,
    endpoints: [],
  },
  isSynapseLinkUpdating: false,
  memoryUsageInfo: undefined,
  isShellEnabled: false,
  notebookBasePath: Constants.Notebook.defaultBasePath,
  isInitializingNotebooks: false,
  myNotebooksContentRoot: undefined,
  galleryContentRoot: undefined,
  connectionInfo: {
    status: ConnectionStatusType.Connect,
  },
  notebookFolderName: undefined,
  isAllocating: false,
  isRefreshed: false,
  containerStatus: {
    status: undefined,
    durationLeftInMinutes: undefined,
    phoenixServerInfo: undefined,
  },
  isPhoenixNotebooks: undefined,
  isPhoenixFeatures: undefined,
  setIsNotebookEnabled: (isNotebookEnabled: boolean) => set({ isNotebookEnabled }),
  setIsNotebooksEnabledForAccount: (isNotebooksEnabledForAccount: boolean) => set({ isNotebooksEnabledForAccount }),
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) =>
    set({ notebookServerInfo }),
  setSparkClusterConnectionInfo: (sparkClusterConnectionInfo: DataModels.SparkClusterConnectionInfo) =>
    set({ sparkClusterConnectionInfo }),
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => set({ isSynapseLinkUpdating }),
  setMemoryUsageInfo: (memoryUsageInfo: DataModels.MemoryUsageInfo) => set({ memoryUsageInfo }),
  setIsShellEnabled: (isShellEnabled: boolean) => set({ isShellEnabled }),
  setNotebookBasePath: (notebookBasePath: string) => set({ notebookBasePath }),
  setNotebookFolderName: (notebookFolderName: string) => set({ notebookFolderName }),
  refreshNotebooksEnabledStateForAccount: async (): Promise<void> => {
    await get().getPhoenixStatus();
    const { databaseAccount, authType } = userContext;
    if (
      authType === AuthType.EncryptedToken ||
      authType === AuthType.ResourceToken ||
      authType === AuthType.MasterKey
    ) {
      set({ isNotebooksEnabledForAccount: false });
      return;
    }

    const firstWriteLocation =
      userContext.apiType === "Postgres" || userContext.apiType === "VCoreMongo"
        ? databaseAccount?.location
        : databaseAccount?.properties?.writeLocations?.[0]?.locationName.toLowerCase();
    const disallowedLocationsUri: string = `${configContext.PORTAL_BACKEND_ENDPOINT}/api/disallowedlocations`;
    const authorizationHeader = getAuthorizationHeader();
    const startKey = TelemetryProcessor.traceStart(Action.RefreshNotebooksEnabled, {
      dataExplorerArea: "Notebook",
    });
    try {
      const response = await fetch(disallowedLocationsUri, {
        method: "POST",
        body: JSON.stringify({
          resourceTypes: [Constants.ArmResourceTypes.notebookWorkspaces],
        }),
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [Constants.HttpHeaders.contentType]: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch disallowed locations");
      }

      const disallowedLocations: string[] = await response.json();
      if (!disallowedLocations) {
        Logger.logInfo("No disallowed locations found", "Explorer/isNotebooksEnabledForAccount");
        set({ isNotebooksEnabledForAccount: true });
        return;
      }

      // firstWriteLocation should not be disallowed
      const isAccountInAllowedLocation = firstWriteLocation && disallowedLocations.indexOf(firstWriteLocation) === -1;
      set({ isNotebooksEnabledForAccount: isAccountInAllowedLocation });
      TelemetryProcessor.traceSuccess(Action.RefreshNotebooksEnabled, { isAccountInAllowedLocation }, startKey);
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/isNotebooksEnabledForAccount");
      set({ isNotebooksEnabledForAccount: false });
      TelemetryProcessor.traceFailure(Action.RefreshNotebooksEnabled, { error: getErrorMessage(error) }, startKey);
    }
  },
  findItem: (root: NotebookContentItem, item: NotebookContentItem): NotebookContentItem => {
    const currentItem = root || get().myNotebooksContentRoot;

    if (currentItem) {
      if (currentItem.path === item.path && currentItem.name === item.name) {
        return currentItem;
      }

      if (currentItem.children) {
        for (const childItem of currentItem.children) {
          const result = get().findItem(childItem, item);
          if (result) {
            return result;
          }
        }
      }
    }

    return undefined;
  },
  insertNotebookItem: (parent: NotebookContentItem, item: NotebookContentItem): void => {
    const root = cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, parent);
    item.parent = parentItem;
    if (parentItem.children) {
      parentItem.children.push(item);
    } else {
      parentItem.children = [item];
    }
    set({ myNotebooksContentRoot: root });
  },
  updateNotebookItem: (item: NotebookContentItem): void => {
    const root = cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, item.parent);
    parentItem.children = parentItem.children.filter((child) => child.path !== item.path);
    parentItem.children.push(item);
    item.parent = parentItem;
    set({ myNotebooksContentRoot: root });
  },
  deleteNotebookItem: (item: NotebookContentItem): void => {
    const root = cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, item.parent);
    parentItem.children = parentItem.children.filter((child) => child.path !== item.path);
    set({ myNotebooksContentRoot: root });
  },
  initializeNotebooksTree: async (): Promise<void> => {
    const notebookFolderName = get().isPhoenixNotebooks ? "Temporary Notebooks" : "My Notebooks";
    set({ notebookFolderName });
    const myNotebooksContentRoot = {
      name: get().notebookFolderName,
      path: get().notebookBasePath,
      type: NotebookContentItemType.Directory,
    };
    const galleryContentRoot = {
      name: "Gallery",
      path: "Gallery",
      type: NotebookContentItemType.File,
    };

    set({
      myNotebooksContentRoot,
      galleryContentRoot,
    });
  },
  setConnectionInfo: (connectionInfo: ContainerConnectionInfo) => set({ connectionInfo }),
  setIsAllocating: (isAllocating: boolean) => set({ isAllocating }),
  resetContainerConnection: (connectionStatus: ContainerConnectionInfo): void => {
    useTabs.getState().closeAllNotebookTabs(true);
    useNotebook.getState().setConnectionInfo(connectionStatus);
    useNotebook.getState().setNotebookServerInfo(undefined);
    useNotebook.getState().setIsAllocating(false);
    useNotebook.getState().setContainerStatus({
      status: undefined,
      durationLeftInMinutes: undefined,
      phoenixServerInfo: undefined,
    });
  },
  setIsRefreshed: (isRefreshed: boolean) => set({ isRefreshed }),
  setContainerStatus: (containerStatus: ContainerInfo) => set({ containerStatus }),
  getPhoenixStatus: async () => {
    if (get().isPhoenixNotebooks === undefined || get().isPhoenixFeatures === undefined) {
      // getDbAccountAllowedStatus has been deprecated; Phoenix features are no longer available.
      set({ isPhoenixNotebooks: false });
      set({ isPhoenixFeatures: false });
    }
  },
  setIsPhoenixNotebooks: (isPhoenixNotebooks: boolean) => set({ isPhoenixNotebooks: isPhoenixNotebooks }),
  setIsPhoenixFeatures: (isPhoenixFeatures: boolean) => set({ isPhoenixFeatures: isPhoenixFeatures }),
}));
