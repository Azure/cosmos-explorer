import { cloneDeep } from "lodash";
import create, { UseStore } from "zustand";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";
import NotebookManager from "./NotebookManager";

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
  gitHubNotebooksContentRoot: NotebookContentItem;
  galleryContentRoot: NotebookContentItem;
  setIsNotebookEnabled: (isNotebookEnabled: boolean) => void;
  setIsNotebooksEnabledForAccount: (isNotebooksEnabledForAccount: boolean) => void;
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => void;
  setSparkClusterConnectionInfo: (sparkClusterConnectionInfo: DataModels.SparkClusterConnectionInfo) => void;
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => void;
  setMemoryUsageInfo: (memoryUsageInfo: DataModels.MemoryUsageInfo) => void;
  setIsShellEnabled: (isShellEnabled: boolean) => void;
  setNotebookBasePath: (notebookBasePath: string) => void;
  refreshNotebooksEnabledStateForAccount: () => Promise<void>;
  findItem: (root: NotebookContentItem, item: NotebookContentItem) => NotebookContentItem;
  updateNotebookItem: (item: NotebookContentItem) => void;
  deleteNotebookItem: (item: NotebookContentItem) => void;
  initializeNotebooksTree: (notebookManager: NotebookManager) => Promise<void>;
}

export const useNotebook: UseStore<NotebookState> = create((set, get) => ({
  isNotebookEnabled: false,
  isNotebooksEnabledForAccount: false,
  notebookServerInfo: {
    notebookServerEndpoint: undefined,
    authToken: undefined,
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
  gitHubNotebooksContentRoot: undefined,
  galleryContentRoot: undefined,
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
  refreshNotebooksEnabledStateForAccount: async (): Promise<void> => {
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
      databaseAccount?.properties?.writeLocations &&
      databaseAccount?.properties?.writeLocations[0]?.locationName.toLowerCase();
    const disallowedLocationsUri = `${configContext.BACKEND_ENDPOINT}/api/disallowedLocations`;
    const authorizationHeader = getAuthorizationHeader();
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
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/isNotebooksEnabledForAccount");
      set({ isNotebooksEnabledForAccount: false });
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
  initializeNotebooksTree: async (notebookManager: NotebookManager): Promise<void> => {
    const myNotebooksContentRoot = {
      name: "My Notebooks",
      path: get().notebookBasePath,
      type: NotebookContentItemType.Directory,
    };
    const galleryContentRoot = {
      name: "Gallery",
      path: "Gallery",
      type: NotebookContentItemType.File,
    };
    const gitHubNotebooksContentRoot = notebookManager?.gitHubOAuthService?.isLoggedIn()
      ? {
          name: "GitHub repos",
          path: "PsuedoDir",
          type: NotebookContentItemType.Directory,
        }
      : undefined;
    set({
      myNotebooksContentRoot,
      galleryContentRoot,
      gitHubNotebooksContentRoot,
    });

    if (get().notebookServerInfo?.notebookServerEndpoint) {
      const updatedRoot = await notebookManager?.notebookContentClient?.updateItemChildren(myNotebooksContentRoot);
      set({ myNotebooksContentRoot: updatedRoot });

      if (updatedRoot?.children) {
        // Count 1st generation children (tree is lazy-loaded)
        const nodeCounts = { files: 0, notebooks: 0, directories: 0 };
        updatedRoot.children.forEach((notebookItem) => {
          switch (notebookItem.type) {
            case NotebookContentItemType.File:
              nodeCounts.files++;
              break;
            case NotebookContentItemType.Directory:
              nodeCounts.directories++;
              break;
            case NotebookContentItemType.Notebook:
              nodeCounts.notebooks++;
              break;
            default:
              break;
          }
        });
        TelemetryProcessor.trace(Action.RefreshResourceTreeMyNotebooks, ActionModifiers.Mark, { ...nodeCounts });
      }
    }
  },
}));
