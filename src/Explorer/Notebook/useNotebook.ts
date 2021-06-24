import create, { UseStore } from "zustand";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { getErrorMessage, handleError } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import {
  get as getWorkspace,
  listConnectionInfo,
  start,
} from "../../Utils/arm/generatedClients/cosmosNotebooks/notebookWorkspaces";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";

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
  setIsNotebookEnabled: (isNotebookEnabled: boolean) => void;
  setIsNotebooksEnabledForAccount: (isNotebooksEnabledForAccount: boolean) => void;
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => void;
  setSparkClusterConnectionInfo: (sparkClusterConnectionInfo: DataModels.SparkClusterConnectionInfo) => void;
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => void;
  setMemoryUsageInfo: (memoryUsageInfo: DataModels.MemoryUsageInfo) => void;
  setIsShellEnabled: (isShellEnabled: boolean) => void;
  setNotebookBasePath: (notebookBasePath: string) => void;
  refreshNotebooksEnabledStateForAccount: () => Promise<void>;
  initNotebooks: () => Promise<void>;
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
  initNotebooks: async (): Promise<void> => {
    if (!userContext?.databaseAccount) {
      throw new Error("No database account specified");
    }

    if (get().isInitializingNotebooks) {
      return;
    }

    set({ isInitializingNotebooks: true });

    await ensureNotebookWorkspaceRunning();
    const connectionInfo = await listConnectionInfo(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      "default"
    );

    set({
      notebookServerInfo: {
        notebookServerEndpoint: userContext.features.notebookServerUrl || connectionInfo.notebookServerEndpoint,
        authToken: userContext.features.notebookServerToken || connectionInfo.authToken,
      },
    });
    this.refreshNotebookList();

    set({ isInitializingNotebooks: false });
  },
}));

const ensureNotebookWorkspaceRunning = async (): Promise<void> => {
  if (!userContext.databaseAccount) {
    return;
  }

  let clearMessage;
  try {
    const notebookWorkspace = await getWorkspace(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      "default"
    );
    if (notebookWorkspace?.properties?.status?.toLowerCase() === "stopped") {
      clearMessage = NotificationConsoleUtils.logConsoleProgress("Initializing notebook workspace");
      await start(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name, "default");
    }
  } catch (error) {
    handleError(error, "Explorer/ensureNotebookWorkspaceRunning", "Failed to initialize notebook workspace");
  } finally {
    clearMessage && clearMessage();
  }
};
