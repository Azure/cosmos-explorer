import { cloneDeep } from "lodash";
import create, { UseStore } from "zustand";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { ConnectionStatusType } from "../../Common/Constants";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { ContainerConnectionInfo } from "../../Contracts/DataModels";
import { IPinnedRepo } from "../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import * as GitHubUtils from "../../Utils/GitHubUtils";
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
  connectionInfo: ContainerConnectionInfo;
  notebookFolderName: string;
  isAllocating: boolean;
  isRefreshed: boolean;
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
  insertNotebookItem: (parent: NotebookContentItem, item: NotebookContentItem, isGithubTree?: boolean) => void;
  updateNotebookItem: (item: NotebookContentItem, isGithubTree?: boolean) => void;
  deleteNotebookItem: (item: NotebookContentItem, isGithubTree?: boolean) => void;
  initializeNotebooksTree: (notebookManager: NotebookManager) => Promise<void>;
  initializeGitHubRepos: (pinnedRepos: IPinnedRepo[]) => void;
  setConnectionInfo: (connectionInfo: ContainerConnectionInfo) => void;
  setIsAllocating: (isAllocating: boolean) => void;
  resetConatinerConnection: (connectionStatus: ContainerConnectionInfo) => void;
  setIsRefreshed: (isAllocating: boolean) => void;
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
  connectionInfo: {
    status: ConnectionStatusType.Connect,
  },
  notebookFolderName: undefined,
  isAllocating: false,
  isRefreshed: false,
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
  insertNotebookItem: (parent: NotebookContentItem, item: NotebookContentItem, isGithubTree?: boolean): void => {
    const root = isGithubTree ? cloneDeep(get().gitHubNotebooksContentRoot) : cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, parent);
    item.parent = parentItem;
    if (parentItem.children) {
      parentItem.children.push(item);
    } else {
      parentItem.children = [item];
    }
    isGithubTree ? set({ gitHubNotebooksContentRoot: root }) : set({ myNotebooksContentRoot: root });
  },
  updateNotebookItem: (item: NotebookContentItem, isGithubTree?: boolean): void => {
    const root = isGithubTree ? cloneDeep(get().gitHubNotebooksContentRoot) : cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, item.parent);
    parentItem.children = parentItem.children.filter((child) => child.path !== item.path);
    parentItem.children.push(item);
    item.parent = parentItem;
    isGithubTree ? set({ gitHubNotebooksContentRoot: root }) : set({ myNotebooksContentRoot: root });
  },
  deleteNotebookItem: (item: NotebookContentItem, isGithubTree?: boolean): void => {
    const root = isGithubTree ? cloneDeep(get().gitHubNotebooksContentRoot) : cloneDeep(get().myNotebooksContentRoot);
    const parentItem = get().findItem(root, item.parent);
    parentItem.children = parentItem.children.filter((child) => child.path !== item.path);
    isGithubTree ? set({ gitHubNotebooksContentRoot: root }) : set({ myNotebooksContentRoot: root });
  },
  initializeNotebooksTree: async (notebookManager: NotebookManager): Promise<void> => {
    const notebookFolderName = userContext.features.phoenix === true ? "Temporary Notebooks" : "My Notebooks";
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
    const gitHubNotebooksContentRoot = {
      name: "GitHub repos",
      path: "PsuedoDir",
      type: NotebookContentItemType.Directory,
    };
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
  initializeGitHubRepos: (pinnedRepos: IPinnedRepo[]): void => {
    const gitHubNotebooksContentRoot = cloneDeep(get().gitHubNotebooksContentRoot);
    if (gitHubNotebooksContentRoot) {
      gitHubNotebooksContentRoot.children = [];
      pinnedRepos?.forEach((pinnedRepo) => {
        const repoFullName = GitHubUtils.toRepoFullName(pinnedRepo.owner, pinnedRepo.name);
        const repoTreeItem: NotebookContentItem = {
          name: repoFullName,
          path: "PsuedoDir",
          type: NotebookContentItemType.Directory,
          children: [],
          parent: gitHubNotebooksContentRoot,
        };

        pinnedRepo.branches.forEach((branch) => {
          repoTreeItem.children.push({
            name: branch.name,
            path: GitHubUtils.toContentUri(pinnedRepo.owner, pinnedRepo.name, branch.name, ""),
            type: NotebookContentItemType.Directory,
            parent: repoTreeItem,
          });
        });

        gitHubNotebooksContentRoot.children.push(repoTreeItem);
      });

      set({ gitHubNotebooksContentRoot });
    }
  },
  setConnectionInfo: (connectionInfo: ContainerConnectionInfo) => set({ connectionInfo }),
  setIsAllocating: (isAllocating: boolean) => set({ isAllocating }),
  resetConatinerConnection: (connectionStatus: ContainerConnectionInfo): void => {
    useNotebook.getState().setConnectionInfo(connectionStatus);
    useNotebook.getState().setNotebookServerInfo({
      notebookServerEndpoint: undefined,
      authToken: undefined,
    });
    useNotebook.getState().setIsAllocating(false);
  },
  setIsRefreshed: (isRefreshed: boolean) => set({ isRefreshed }),
}));
