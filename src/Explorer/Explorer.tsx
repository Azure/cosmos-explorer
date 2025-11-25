import * as msal from "@azure/msal-browser";
import { Link } from "@fluentui/react/lib/Link";
import { isPublicInternetAccessAllowed } from "Common/DatabaseAccountUtility";
import { Environment, getEnvironment } from "Common/EnvironmentUtility";
import { sendMessage } from "Common/MessageHandler";
import { Platform, configContext } from "ConfigContext";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { useDataPlaneRbac } from "Explorer/Panes/SettingsPane/SettingsPane";
import { getCopilotEnabled, isCopilotFeatureRegistered } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { IGalleryItem } from "Juno/JunoClient";
import {
  isFabricMirrored,
  isFabricMirroredKey,
  isFabricNative,
  scheduleRefreshFabricToken,
} from "Platform/Fabric/FabricUtil";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { acquireMsalTokenForAccount } from "Utils/AuthorizationUtils";
import { allowedNotebookServerUrls, validateEndpoint } from "Utils/EndpointUtils";
import { featureRegistered } from "Utils/FeatureRegistrationUtils";
import { getVSCodeUrl } from "Utils/VSCodeExtensionUtils";
import { update } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import * as ko from "knockout";
import React from "react";
import _ from "underscore";
import shallow from "zustand/shallow";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import * as Constants from "../Common/Constants";
import { Areas, ConnectionStatusType, HttpStatusCodes, Notebook, PoolIdType } from "../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { QueriesClient } from "../Common/QueriesClient";
import { readCollection, readSampleCollection } from "../Common/dataAccess/readCollection";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import * as DataModels from "../Contracts/DataModels";
import { ContainerConnectionInfo, IPhoenixServiceInfo, IProvisionData, IResponse } from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { UploadDetailsRecord } from "../Contracts/ViewModels";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { PhoenixClient } from "../Phoenix/PhoenixClient";
import * as ExplorerSettings from "../Shared/ExplorerSettings";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext, userContext } from "../UserContext";
import { getCollectionName, getUploadName } from "../Utils/APITypeUtils";
import { stringToBlob } from "../Utils/BlobUtils";
import { isCapabilityEnabled } from "../Utils/CapabilityUtils";
import { fromContentUri, toRawContentUri } from "../Utils/GitHubUtils";
import * as NotificationConsoleUtils from "../Utils/NotificationConsoleUtils";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import { useSidePanel } from "../hooks/useSidePanel";
import { ReactTabKind, useTabs } from "../hooks/useTabs";
import "./ComponentRegisterer";
import { DialogProps, useDialog } from "./Controls/Dialog";
import { GalleryTab as GalleryTabKind } from "./Controls/NotebookGallery/GalleryViewerComponent";
import { useCommandBar } from "./Menus/CommandBar/CommandBarComponentAdapter";
import * as FileSystemUtil from "./Notebook/FileSystemUtil";
import { SnapshotRequest } from "./Notebook/NotebookComponent/types";
import { NotebookContentItem, NotebookContentItemType } from "./Notebook/NotebookContentItem";
import type NotebookManager from "./Notebook/NotebookManager";
import { NotebookPaneContent } from "./Notebook/NotebookManager";
import { NotebookUtil } from "./Notebook/NotebookUtil";
import { useNotebook } from "./Notebook/useNotebook";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel/AddCollectionPanel";
import { CassandraAddCollectionPane } from "./Panes/CassandraAddCollectionPane/CassandraAddCollectionPane";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane/ExecuteSprocParamsPane";
import { StringInputPane } from "./Panes/StringInputPane/StringInputPane";
import { UploadItemsPane } from "./Panes/UploadItemsPane/UploadItemsPane";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import NotebookV2Tab, { NotebookTabOptions } from "./Tabs/NotebookV2Tab";
import TabsBase from "./Tabs/TabsBase";
import TerminalTab from "./Tabs/TerminalTab";
import Database from "./Tree/Database";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import StoredProcedure from "./Tree/StoredProcedure";
import { useDatabases } from "./useDatabases";
import { useSelectedNode } from "./useSelectedNode";

BindingHandlersRegisterer.registerBindingHandlers();

export default class Explorer {
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;

  // Resource Tree
  private resourceTree: ResourceTreeAdapter;

  // Tabs
  public isTabsContentExpanded: ko.Observable<boolean>;

  public gitHubOAuthService: GitHubOAuthService;

  // Notebooks
  public notebookManager?: NotebookManager;

  private _isInitializingNotebooks: boolean;
  private notebookToImport: {
    name: string;
    content: string;
  };

  private static readonly MaxNbDatabasesToAutoExpand = 5;
  public phoenixClient: PhoenixClient;
  constructor() {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    this._isInitializingNotebooks = false;

    this.phoenixClient = new PhoenixClient(userContext?.databaseAccount?.id);
    useNotebook.subscribe(
      () => this.refreshCommandBarButtons(),
      (state) => state.isNotebooksEnabledForAccount,
    );

    this.queriesClient = new QueriesClient(this);

    useSelectedNode.subscribe(() => {
      // Make sure switching tabs restores tabs display
      this.isTabsContentExpanded(false);
    });

    this.isFixedCollectionWithSharedThroughputSupported = ko.computed(() => {
      if (userContext.features.enableFixedCollectionWithSharedThroughput) {
        return true;
      }

      if (!userContext.databaseAccount) {
        return false;
      }

      return isCapabilityEnabled("EnableMongo");
    });

    useTabs.subscribe(
      (openedTabs: TabsBase[]) => {
        if (openedTabs.length === 0) {
          useSelectedNode.getState().setSelectedNode(undefined);
          useCommandBar.getState().setContextButtons([]);
        }
      },
      (state) => state.openedTabs,
    );

    this.isTabsContentExpanded = ko.observable(false);

    $(() => {
      $(document.body).click(() => $(".commandDropdownContainer").hide());
    });

    switch (userContext.apiType) {
      case "Tables":
        this.tableDataClient = new TablesAPIDataClient();
        break;
      case "Cassandra":
        this.tableDataClient = new CassandraAPIDataClient();
        break;
      default:
    }

    this._initSettings();

    TelemetryProcessor.traceSuccess(
      Action.InitializeDataExplorer,
      { dataExplorerArea: Constants.Areas.ResourceTree },
      startKey,
    );

    useNotebook.subscribe(
      async () => this.initiateAndRefreshNotebookList(),
      (state) => [state.isNotebookEnabled, state.isRefreshed],
      shallow,
    );

    this.resourceTree = new ResourceTreeAdapter(this);

    // Override notebook server parameters from URL parameters
    if (
      userContext.features.notebookServerUrl &&
      validateEndpoint(userContext.features.notebookServerUrl, allowedNotebookServerUrls) &&
      userContext.features.notebookServerToken
    ) {
      useNotebook.getState().setNotebookServerInfo({
        notebookServerEndpoint: userContext.features.notebookServerUrl,
        authToken: userContext.features.notebookServerToken,
        forwardingId: undefined,
      });
    }

    if (userContext.features.notebookBasePath) {
      useNotebook.getState().setNotebookBasePath(userContext.features.notebookBasePath);
    }

    if (isFabricMirrored()) {
      useTabs.getState().closeReactTab(ReactTabKind.Home);
    }

    this.refreshExplorer();
  }

  public async initiateAndRefreshNotebookList(): Promise<void> {
    if (!this.notebookManager) {
      const NotebookManager = (await import(/* webpackChunkName: "NotebookManager" */ "./Notebook/NotebookManager"))
        .default;
      this.notebookManager = new NotebookManager();
      this.notebookManager.initialize({
        container: this,
        resourceTree: this.resourceTree,
        refreshCommandBarButtons: () => this.refreshCommandBarButtons(),
        refreshNotebookList: () => this.refreshNotebookList(),
      });
    }

    this.refreshCommandBarButtons();
    this.refreshNotebookList();
  }

  public openEnableSynapseLinkDialog(): void {
    const addSynapseLinkDialogProps: DialogProps = {
      linkProps: {
        linkText: "Learn more",
        linkUrl: "https://aka.ms/cosmosdb-synapselink",
      },
      isModal: true,
      title: `Enable Azure Synapse Link on your Cosmos DB account`,
      subText: `Enable Azure Synapse Link to perform near real time analytical analytics on this account, without impacting the performance of your transactional workloads.
      Azure Synapse Link brings together Cosmos Db Analytical Store and Synapse Analytics`,
      primaryButtonText: "Enable Azure Synapse Link",
      secondaryButtonText: "Cancel",

      onPrimaryButtonClick: async () => {
        const startTime = TelemetryProcessor.traceStart(Action.EnableAzureSynapseLink);
        const clearInProgressMessage = logConsoleProgress(
          "Enabling Azure Synapse Link for this account. This may take a few minutes before you can enable analytical store for this account.",
        );
        useNotebook.getState().setIsSynapseLinkUpdating(true);
        useDialog.getState().closeDialog();

        try {
          await update(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name, {
            properties: {
              enableAnalyticalStorage: true,
            },
          });

          clearInProgressMessage();
          logConsoleInfo("Enabled Azure Synapse Link for this account");
          TelemetryProcessor.traceSuccess(Action.EnableAzureSynapseLink, {}, startTime);
          userContext.databaseAccount.properties.enableAnalyticalStorage = true;
        } catch (error) {
          clearInProgressMessage();
          logConsoleError(`Enabling Azure Synapse Link for this account failed. ${getErrorMessage(error)}`);
          TelemetryProcessor.traceFailure(Action.EnableAzureSynapseLink, {}, startTime);
        } finally {
          useNotebook.getState().setIsSynapseLinkUpdating(false);
        }
      },

      onSecondaryButtonClick: () => {
        useDialog.getState().closeDialog();
        TelemetryProcessor.traceCancel(Action.EnableAzureSynapseLink);
      },
    };
    useDialog.getState().openDialog(addSynapseLinkDialogProps);
    TelemetryProcessor.traceStart(Action.EnableAzureSynapseLink);
  }

  public async openLoginForEntraIDPopUp(): Promise<void> {
    if (userContext.databaseAccount.properties?.documentEndpoint) {
      try {
        const aadToken = await acquireMsalTokenForAccount(userContext.databaseAccount, false);
        updateUserContext({ aadToken: aadToken });
        useDataPlaneRbac.setState({ aadTokenUpdated: true });
      } catch (error) {
        if (error instanceof msal.AuthError && error.errorCode === msal.BrowserAuthErrorMessage.popUpWindowError.code) {
          logConsoleError(
            "We were unable to establish authorization for this account, due to pop-ups being disabled in the browser.\nPlease enable pop-ups for this site and try again",
          );
        } else {
          const errorJson = JSON.stringify(error);
          logConsoleError(
            `Failed to perform authorization for this account, due to the following error: \n${errorJson}`,
          );
        }
      }
    }
  }

  public openInVsCode(): void {
    const vscodeUrl = getVSCodeUrl();
    const openVSCodeDialogProps: DialogProps = {
      linkProps: {
        linkText: "Download Visual Studio Code",
        linkUrl: "https://code.visualstudio.com/download",
      },
      isModal: true,
      title: `Open your Azure Cosmos DB account in Visual Studio Code`,
      subText: `Please ensure Visual Studio Code is installed on your device.
      If you don't have it installed, please download it from the link below.`,
      primaryButtonText: "Open in VS Code",
      secondaryButtonText: "Cancel",

      onPrimaryButtonClick: () => {
        try {
          window.location.href = vscodeUrl;
          TelemetryProcessor.traceStart(Action.OpenVSCode);
        } catch (error) {
          logConsoleError(`Failed to open VS Code: ${getErrorMessage(error)}`);
        }
      },
      onSecondaryButtonClick: () => {
        useDialog.getState().closeDialog();
        TelemetryProcessor.traceCancel(Action.OpenVSCode);
      },
    };
    useDialog.getState().openDialog(openVSCodeDialogProps);
  }

  public async openCESCVAFeedbackBlade(): Promise<void> {
    sendMessage({ type: MessageTypes.OpenCESCVAFeedbackBlade });
    Logger.logInfo(
      `CES CVA Feedback logging current date when survey is shown ${Date.now().toString()}`,
      "Explorer/openCESCVAFeedbackBlade",
    );
  }

  public async openContainerCopyFeedbackBlade(): Promise<void> {
    sendMessage({ type: MessageTypes.OpenContainerCopyFeedbackBlade });
    Logger.logInfo(
      `Container Copy Feedback logging current date when survey is shown ${Date.now().toString()}`,
      "Explorer/openContainerCopyFeedbackBlade",
    );
  }

  public async refreshDatabaseForResourceToken(): Promise<void> {
    const databaseId = userContext.parsedResourceToken?.databaseId;
    const collectionId = userContext.parsedResourceToken?.collectionId;
    if (!databaseId || !collectionId) {
      return;
    }

    const collection: DataModels.Collection = await readCollection(databaseId, collectionId);
    const resourceTokenCollection = new ResourceTokenCollection(this, databaseId, collection);
    useDatabases.setState({ resourceTokenCollection });
    useSelectedNode.getState().setSelectedNode(resourceTokenCollection);
  }

  public async refreshAllDatabases(): Promise<void> {
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    try {
      const databases: DataModels.Database[] = await readDatabases();
      TelemetryProcessor.traceSuccess(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
        },
        startKey,
      );
      const currentDatabases = useDatabases.getState().databases;
      const deltaDatabases = this.getDeltaDatabases(databases, currentDatabases);
      let updatedDatabases = currentDatabases.filter(
        (database) => !deltaDatabases.toDelete.some((deletedDatabase) => deletedDatabase.id() === database.id()),
      );
      updatedDatabases = [...updatedDatabases, ...deltaDatabases.toAdd].sort((db1, db2) =>
        db1.id().localeCompare(db2.id()),
      );
      useDatabases.setState({ databases: updatedDatabases });
      await this.refreshAndExpandNewDatabases(deltaDatabases.toAdd, updatedDatabases);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey,
      );
      logConsoleError(`Error while refreshing databases: ${errorMessage}`);
    }
  }

  public onRefreshDatabasesKeyPress = (source: string, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onRefreshResourcesClick();
      return false;
    }
    return true;
  };

  public onRefreshResourcesClick = async (): Promise<void> => {
    if (isFabricMirroredKey()) {
      scheduleRefreshFabricToken(true).then(() => this.refreshAllDatabases());
      return;
    }

    await (userContext.authType === AuthType.ResourceToken
      ? this.refreshDatabaseForResourceToken()
      : this.refreshAllDatabases());
    await this.refreshNotebookList();
  };

  // Facade
  public provideFeedbackEmail = (): void => {
    window.open(Constants.Urls.feedbackEmail, "_blank");
  };

  public async initNotebooks(databaseAccount: DataModels.DatabaseAccount): Promise<void> {
    if (!databaseAccount) {
      throw new Error("No database account specified");
    }

    if (this._isInitializingNotebooks) {
      return;
    }
    this._isInitializingNotebooks = true;
    this.refreshNotebookList();
    this._isInitializingNotebooks = false;
  }

  public async allocateContainer(poolId: PoolIdType, mode?: string): Promise<void> {
    const shouldUseNotebookStates = poolId === PoolIdType.DefaultPoolId ? true : false;
    const notebookServerInfo = shouldUseNotebookStates
      ? useNotebook.getState().notebookServerInfo
      : useQueryCopilot.getState().notebookServerInfo;

    const isAllocating = shouldUseNotebookStates
      ? useNotebook.getState().isAllocating
      : useQueryCopilot.getState().isAllocatingContainer;
    if (
      isAllocating === false &&
      (notebookServerInfo === undefined ||
        (notebookServerInfo && notebookServerInfo.notebookServerEndpoint === undefined))
    ) {
      const connectionStatus: ContainerConnectionInfo = {
        status: ConnectionStatusType.Connecting,
      };

      shouldUseNotebookStates && useNotebook.getState().setConnectionInfo(connectionStatus);

      let connectionInfo;
      let provisionData: IProvisionData;
      try {
        TelemetryProcessor.traceStart(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
        });
        if (shouldUseNotebookStates) {
          useNotebook.getState().setIsAllocating(true);
          provisionData = {
            cosmosEndpoint: userContext?.databaseAccount?.properties?.documentEndpoint,
            poolId: undefined,
          };
        } else {
          useQueryCopilot.getState().setIsAllocatingContainer(true);
          provisionData = {
            poolId: poolId,
            databaseId: useTabs.getState().activeTab.collection.databaseId,
            containerId: useTabs.getState().activeTab.collection.id(),
            mode: mode,
          };
        }
        connectionInfo = await this.phoenixClient.allocateContainer(provisionData);
        if (!connectionInfo?.data?.phoenixServiceUrl) {
          throw new Error(`PhoenixServiceUrl is invalid!`);
        }
        await this.setNotebookInfo(shouldUseNotebookStates, connectionInfo, connectionStatus);
        TelemetryProcessor.traceSuccess(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
        });
      } catch (error) {
        TelemetryProcessor.traceFailure(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
          status: error.status,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        });
        if (shouldUseNotebookStates) {
          connectionStatus.status = ConnectionStatusType.Failed;
          shouldUseNotebookStates
            ? useNotebook.getState().resetContainerConnection(connectionStatus)
            : useQueryCopilot.getState().resetContainerConnection();
          if (error?.status === HttpStatusCodes.Forbidden && error.message) {
            useDialog.getState().showOkModalDialog("Connection Failed", `${error.message}`);
          } else {
            useDialog
              .getState()
              .showOkModalDialog(
                "Connection Failed",
                "We are unable to connect to the temporary workspace. Please try again in a few minutes. If the error persists, file a support ticket.",
              );
          }
        }
        throw error;
      } finally {
        shouldUseNotebookStates
          ? useNotebook.getState().setIsAllocating(false)
          : useQueryCopilot.getState().setIsAllocatingContainer(false);
        this.refreshCommandBarButtons();
        this.refreshNotebookList();
        this._isInitializingNotebooks = false;
      }
    }
  }

  public async setNotebookInfo(
    shouldUseNotebookStates: boolean,
    connectionInfo: IResponse<IPhoenixServiceInfo>,
    connectionStatus: DataModels.ContainerConnectionInfo,
  ): Promise<void> {
    const containerData = {
      forwardingId: connectionInfo.data.forwardingId,
      dbAccountName: userContext.databaseAccount.name,
    };
    await this.phoenixClient.initiateContainerHeartBeat(shouldUseNotebookStates, containerData);

    connectionStatus.status = ConnectionStatusType.Connected;
    shouldUseNotebookStates && useNotebook.getState().setConnectionInfo(connectionStatus);

    const noteBookServerInfo = {
      notebookServerEndpoint:
        (validateEndpoint(userContext.features.notebookServerUrl, allowedNotebookServerUrls) &&
          userContext.features.notebookServerUrl) ||
        connectionInfo.data.phoenixServiceUrl,
      authToken: userContext.features.notebookServerToken || connectionInfo.data.authToken,
      forwardingId: connectionInfo.data.forwardingId,
    };
    shouldUseNotebookStates
      ? useNotebook.getState().setNotebookServerInfo(noteBookServerInfo)
      : useQueryCopilot.getState().setNotebookServerInfo(noteBookServerInfo);

    shouldUseNotebookStates &&
      this.notebookManager?.notebookClient
        .getMemoryUsage()
        .then((memoryUsageInfo) => useNotebook.getState().setMemoryUsageInfo(memoryUsageInfo));
  }

  private getDeltaDatabases(
    updatedDatabaseList: DataModels.Database[],
    databases: ViewModels.Database[],
  ): {
    toAdd: ViewModels.Database[];
    toDelete: ViewModels.Database[];
  } {
    const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
      const databaseExists = _.some(
        databases,
        (existingDatabase: ViewModels.Database) => existingDatabase.id() === database.id,
      );
      return !databaseExists;
    });
    const databasesToAdd: ViewModels.Database[] = newDatabases.map(
      (newDatabase: DataModels.Database) => new Database(this, newDatabase),
    );

    const databasesToDelete: ViewModels.Database[] = [];
    databases.forEach((database: ViewModels.Database) => {
      const databasePresentInUpdatedList = _.some(
        updatedDatabaseList,
        (db: DataModels.Database) => db.id === database.id(),
      );
      if (!databasePresentInUpdatedList) {
        databasesToDelete.push(database);
      }
    });

    return { toAdd: databasesToAdd, toDelete: databasesToDelete };
  }

  private async refreshAndExpandNewDatabases(
    newDatabases: ViewModels.Database[],
    databases: ViewModels.Database[],
  ): Promise<void> {
    // we reload collections for all databases so the resource tree reflects any collection-level changes
    // i.e addition of stored procedures, etc.

    // If the user has a lot of databases, only load expanded databases.
    const databasesToLoad =
      databases.length <= Explorer.MaxNbDatabasesToAutoExpand
        ? databases
        : databases.filter((db) => db.isDatabaseExpanded() || db.id() === Constants.SavedQueries.DatabaseName);

    const startKey: number = TelemetryProcessor.traceStart(Action.LoadCollections, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    try {
      await Promise.all(
        databasesToLoad.map(async (database: ViewModels.Database) => {
          await database.loadCollections(true);
          const isNewDatabase: boolean = _.some(newDatabases, (db: ViewModels.Database) => db.id() === database.id());
          if (isNewDatabase) {
            database.expandDatabase();
          }
          useTabs
            .getState()
            .refreshActiveTab((tab) => tab.collection && tab.collection.getDatabase().id() === database.id());
          TelemetryProcessor.traceSuccess(
            Action.LoadCollections,
            { dataExplorerArea: Constants.Areas.ResourceTree },
            startKey,
          );
        }),
      );
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.LoadCollections,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );
    }
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    } else {
      ExplorerSettings.ensurePriorityLevel();
    }
  }

  public uploadFile(
    name: string,
    content: string,
    parent: NotebookContentItem,
    isGithubTree?: boolean,
  ): Promise<NotebookContentItem> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to upload notebook, but notebook is not enabled";
      handleError(error, "Explorer/uploadFile");
      throw new Error(error);
    }

    const promise = this.notebookManager?.notebookContentClient.uploadFileAsync(name, content, parent, isGithubTree);
    promise
      .then(() => this.resourceTree.triggerRender())
      .catch((reason) => useDialog.getState().showOkModalDialog("Unable to upload file", getErrorMessage(reason)));
    return promise;
  }

  public async importAndOpen(path: string): Promise<boolean> {
    const name = NotebookUtil.getName(path);
    const item = NotebookUtil.createNotebookContentItem(name, path, "file");
    const parent = this.resourceTree.myNotebooksContentRoot;

    if (parent && parent.children && useNotebook.getState().isNotebookEnabled && this.notebookManager?.notebookClient) {
      const existingItem = _.find(parent.children, (node) => node.name === name);
      if (existingItem) {
        return this.openNotebook(existingItem);
      }

      const content = await this.readFile(item);
      const uploadedItem = await this.uploadFile(name, content, parent);
      return this.openNotebook(uploadedItem);
    }

    return Promise.resolve(false);
  }

  public async importAndOpenContent(name: string, content: string): Promise<boolean> {
    const parent = this.resourceTree.myNotebooksContentRoot;

    if (parent && parent.children && useNotebook.getState().isNotebookEnabled && this.notebookManager?.notebookClient) {
      if (this.notebookToImport && this.notebookToImport.name === name && this.notebookToImport.content === content) {
        this.notebookToImport = undefined; // we don't want to try opening this notebook again
      }

      const existingItem = _.find(parent.children, (node) => node.name === name);
      if (existingItem) {
        return this.openNotebook(existingItem);
      }

      const uploadedItem = await this.uploadFile(name, content, parent);
      return this.openNotebook(uploadedItem);
    }

    this.notebookToImport = { name, content }; // we'll try opening this notebook later on
    return Promise.resolve(false);
  }

  public async publishNotebook(
    name: string,
    content: NotebookPaneContent,
    notebookContentRef?: string,
    onTakeSnapshot?: (request: SnapshotRequest) => void,
    onClosePanel?: () => void,
  ): Promise<void> {
    if (this.notebookManager) {
      await this.notebookManager.openPublishNotebookPane(
        name,
        content,
        notebookContentRef,
        onTakeSnapshot,
        onClosePanel,
      );
    }
  }

  public copyNotebook(name: string, content: string): void {
    this.notebookManager?.openCopyNotebookPane(name, content);
  }

  /**
   * Note: To keep it simple, this creates a disconnected NotebookContentItem that is not connected to the resource tree.
   * Connecting it to a tree possibly requires the intermediate missing folders if the item is nested in a subfolder.
   * Manually creating the missing folders between the root and its parent dir would break the UX: expanding a folder
   * will not fetch its content if the children array exists (and has only one child which was manually created).
   * Fetching the intermediate folders possibly involves a few chained async calls which isn't ideal.
   *
   * @param name
   * @param path
   */
  public createNotebookContentItemFile(name: string, path: string): NotebookContentItem {
    return NotebookUtil.createNotebookContentItem(name, path, "file");
  }

  public async openNotebook(notebookContentItem: NotebookContentItem): Promise<boolean> {
    if (!notebookContentItem || !notebookContentItem.path) {
      throw new Error(`Invalid notebookContentItem: ${notebookContentItem}`);
    }
    if (notebookContentItem.type === NotebookContentItemType.Notebook && useNotebook.getState().isPhoenixNotebooks) {
      await this.allocateContainer(PoolIdType.DefaultPoolId);
    }

    const notebookTabs = useTabs
      .getState()
      .getTabs(
        ViewModels.CollectionTabKind.NotebookV2,
        (tab) =>
          (tab as NotebookV2Tab).notebookPath &&
          FileSystemUtil.isPathEqual((tab as NotebookV2Tab).notebookPath(), notebookContentItem.path),
      ) as NotebookV2Tab[];
    let notebookTab = notebookTabs && notebookTabs[0];

    if (notebookTab) {
      useTabs.getState().activateTab(notebookTab);
    } else {
      const options: NotebookTabOptions = {
        account: userContext.databaseAccount,
        tabKind: ViewModels.CollectionTabKind.NotebookV2,
        node: undefined,
        title: notebookContentItem.name,
        tabPath: notebookContentItem.path,
        collection: undefined,
        masterKey: userContext.masterKey || "",
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: undefined,
        container: this,
        notebookContentItem,
      };

      try {
        const NotebookTabV2 = await import(/* webpackChunkName: "NotebookV2Tab" */ "./Tabs/NotebookV2Tab");
        notebookTab = new NotebookTabV2.default(options);
        useTabs.getState().activateNewTab(notebookTab);
      } catch (reason) {
        console.error("Import NotebookV2Tab failed!", reason);
        return false;
      }
    }

    return true;
  }

  public renameNotebook(notebookFile: NotebookContentItem, isGithubTree?: boolean): void {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to rename notebook, but notebook is not enabled";
      handleError(error, "Explorer/renameNotebook");
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.NotebookV2, (tab: NotebookV2Tab) => {
        return tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), notebookFile.path);
      });
    if (openedNotebookTabs.length > 0) {
      useDialog
        .getState()
        .showOkModalDialog("Unable to rename file", "This file is being edited. Please close the tab and try again.");
    } else {
      useSidePanel.getState().openSidePanel(
        "Rename Notebook",
        <StringInputPane
          closePanel={() => {
            useSidePanel.getState().closeSidePanel();
            this.resourceTree.triggerRender();
          }}
          inputLabel="Enter new notebook name"
          submitButtonLabel="Rename"
          errorMessage="Could not rename notebook"
          inProgressMessage="Renaming notebook to"
          successMessage="Renamed notebook to"
          paneTitle="Rename Notebook"
          defaultInput={FileSystemUtil.stripExtension(notebookFile.name, "ipynb")}
          onSubmit={(notebookFile: NotebookContentItem, input: string): Promise<NotebookContentItem> =>
            this.notebookManager?.notebookContentClient.renameNotebook(notebookFile, input, isGithubTree)
          }
          notebookFile={notebookFile}
        />,
      );
    }
  }

  public onCreateDirectory(parent: NotebookContentItem, isGithubTree?: boolean): void {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to create notebook directory, but notebook is not enabled";
      handleError(error, "Explorer/onCreateDirectory");
      throw new Error(error);
    }

    useSidePanel.getState().openSidePanel(
      "Create new directory",
      <StringInputPane
        closePanel={() => {
          useSidePanel.getState().closeSidePanel();
          this.resourceTree.triggerRender();
        }}
        errorMessage="Could not create directory "
        inProgressMessage="Creating directory "
        successMessage="Created directory "
        inputLabel="Enter new directory name"
        paneTitle="Create new directory"
        submitButtonLabel="Create"
        defaultInput=""
        onSubmit={(notebookFile: NotebookContentItem, input: string): Promise<NotebookContentItem> =>
          this.notebookManager?.notebookContentClient.createDirectory(notebookFile, input, isGithubTree)
        }
        notebookFile={parent}
      />,
    );
  }

  public readFile(notebookFile: NotebookContentItem): Promise<string> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to read file, but notebook is not enabled";
      handleError(error, "Explorer/downloadFile");
      throw new Error(error);
    }

    return this.notebookManager?.notebookContentClient.readFileContent(notebookFile.path);
  }

  public downloadFile(notebookFile: NotebookContentItem): Promise<void> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to download file, but notebook is not enabled";
      handleError(error, "Explorer/downloadFile");
      throw new Error(error);
    }

    const clearMessage = NotificationConsoleUtils.logConsoleProgress(`Downloading ${notebookFile.path}`);

    return this.notebookManager?.notebookContentClient.readFileContent(notebookFile.path).then(
      (content: string) => {
        const blob = stringToBlob(content, "text/plain");
        if (navigator.msSaveBlob) {
          // for IE and Edge
          navigator.msSaveBlob(blob, notebookFile.name);
        } else {
          const downloadLink: HTMLAnchorElement = document.createElement("a");
          const url = URL.createObjectURL(blob);
          downloadLink.href = url;
          downloadLink.target = "_self";
          downloadLink.download = notebookFile.name;

          // for some reason, FF displays the download prompt only when
          // the link is added to the dom so we add and remove it
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
        }

        clearMessage();
      },
      (error) => {
        logConsoleError(`Could not download notebook ${getErrorMessage(error)}`);
        clearMessage();
      },
    );
  }

  private refreshNotebookList = async (): Promise<void> => {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      return;
    }

    await this.resourceTree.initialize();
    await useNotebook.getState().initializeNotebooksTree(this.notebookManager);

    this.notebookManager?.refreshPinnedRepos();
    if (this.notebookToImport) {
      this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
    }
  };

  public deleteNotebookFile(item: NotebookContentItem, isGithubTree?: boolean): Promise<void> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to delete notebook file, but notebook is not enabled";
      handleError(error, "Explorer/deleteNotebookFile");
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.NotebookV2, (tab: NotebookV2Tab) => {
        return tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), item.path);
      });
    if (openedNotebookTabs.length > 0) {
      useDialog
        .getState()
        .showOkModalDialog("Unable to delete file", "This file is being edited. Please close the tab and try again.");
      return Promise.reject();
    }

    if (item.type === NotebookContentItemType.Directory && item.children && item.children.length > 0) {
      useDialog.getState().openDialog({
        isModal: true,
        title: "Unable to delete file",
        subText: "Directory is not empty.",
        primaryButtonText: "Close",
        secondaryButtonText: undefined,
        onPrimaryButtonClick: () => useDialog.getState().closeDialog(),
        onSecondaryButtonClick: undefined,
      });
      return Promise.reject();
    }

    return this.notebookManager?.notebookContentClient.deleteContentItem(item, isGithubTree).then(
      () => logConsoleInfo(`Successfully deleted: ${item.path}`),
      (reason) => logConsoleError(`Failed to delete "${item.path}": ${JSON.stringify(reason)}`),
    );
  }

  // TODO: Delete this function when ResourceTreeAdapter is removed.
  public async refreshContentItem(item: NotebookContentItem): Promise<void> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      handleError(error, "Explorer/refreshContentItem");
      return Promise.reject(new Error(error));
    }

    await this.notebookManager?.notebookContentClient.updateItemChildrenInPlace(item);
  }

  public async openNotebookTerminal(kind: ViewModels.TerminalKind): Promise<void> {
    if (userContext.features.enableCloudShell) {
      this.connectToNotebookTerminal(kind);
    } else if (useNotebook.getState().isPhoenixFeatures) {
      await this.allocateContainer(PoolIdType.DefaultPoolId);
      const notebookServerInfo = useNotebook.getState().notebookServerInfo;
      if (notebookServerInfo && notebookServerInfo.notebookServerEndpoint !== undefined) {
        this.connectToNotebookTerminal(kind);
      } else {
        useDialog
          .getState()
          .showOkModalDialog(
            "Failed to connect",
            "Failed to connect to temporary workspace. This could happen because of network issues. Please refresh the page and try again.",
          );
      }
    } else {
      this.connectToNotebookTerminal(kind);
    }
  }

  private connectToNotebookTerminal(kind: ViewModels.TerminalKind): void {
    let title: string;

    switch (kind) {
      case ViewModels.TerminalKind.Mongo:
        title = "Mongo Shell";
        break;

      case ViewModels.TerminalKind.Cassandra:
        title = "Cassandra Shell";
        break;

      case ViewModels.TerminalKind.Postgres:
        title = "PSQL Shell";
        break;

      case ViewModels.TerminalKind.VCoreMongo:
        title = "Mongo Shell";
        break;

      default:
        throw new Error("Terminal kind: ${kind} not supported");
    }

    const terminalTabs: TerminalTab[] = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Terminal, (tab) => tab.tabTitle().startsWith(title)) as TerminalTab[];

    let index = 1;
    if (terminalTabs.length > 0) {
      index = terminalTabs[terminalTabs.length - 1].index + 1;
    }

    const newTab = new TerminalTab({
      account: userContext.databaseAccount,
      tabKind: ViewModels.CollectionTabKind.Terminal,
      node: undefined,
      title: `${title} ${index}`,
      tabPath: `${title} ${index}`,
      collection: undefined,
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: undefined,
      container: this,
      kind: kind,
      index: index,
    });

    useTabs.getState().activateNewTab(newTab);
  }

  public async openGallery(
    selectedTab?: GalleryTabKind,
    notebookUrl?: string,
    galleryItem?: IGalleryItem,
    isFavorite?: boolean,
  ): Promise<void> {
    const title = "Gallery";
    const GalleryTab = await (await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab")).default;
    const galleryTab = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Gallery)
      .find((tab) => tab.tabTitle() === title);

    if (galleryTab instanceof GalleryTab) {
      useTabs.getState().activateTab(galleryTab);
    } else {
      useTabs.getState().activateNewTab(
        new GalleryTab(
          {
            tabKind: ViewModels.CollectionTabKind.Gallery,
            title,
            tabPath: title,
            onLoadStartKey: undefined,
            isTabsContentExpanded: ko.observable(true),
          },
          {
            account: userContext.databaseAccount,
            container: this,
            junoClient: this.notebookManager?.junoClient,
            selectedTab: selectedTab || GalleryTabKind.OfficialSamples,
            notebookUrl,
            galleryItem,
            isFavorite,
          },
        ),
      );
    }
  }

  public async onNewCollectionClicked(
    options: {
      databaseId?: string;
      isQuickstart?: boolean;
    } = {},
  ): Promise<void> {
    if (userContext.apiType === "Cassandra") {
      useSidePanel
        .getState()
        .openSidePanel(
          "Add Table",
          <CassandraAddCollectionPane explorer={this} cassandraApiClient={new CassandraAPIDataClient()} />,
        );
    } else {
      const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
      throughputCap && throughputCap !== -1
        ? await useDatabases.getState().loadAllOffers()
        : await useDatabases.getState().loadDatabaseOffers();
      useSidePanel
        .getState()
        .openSidePanel("New " + getCollectionName(), <AddCollectionPanel explorer={this} {...options} />);
    }
  }

  private refreshCommandBarButtons(): void {
    const activeTab = useTabs.getState().activeTab;
    if (activeTab) {
      activeTab.onActivate(); // TODO only update tabs buttons?
    } else {
      useCommandBar.getState().setContextButtons([]);
    }
  }

  public async handleOpenFileAction(path: string): Promise<void> {
    if (useNotebook.getState().isPhoenixNotebooks === undefined) {
      await useNotebook.getState().getPhoenixStatus();
    }
    if (useNotebook.getState().isPhoenixNotebooks) {
      await this.allocateContainer(PoolIdType.DefaultPoolId);
    }

    // We still use github urls like https://github.com/Azure-Samples/cosmos-notebooks/blob/master/CSharp_quickstarts/GettingStarted_CSharp.ipynb
    // when launching a notebook quickstart from Portal. In future we should just use gallery id and use Juno to fetch instead of directly
    // calling GitHub. For now convert this url to a raw url and download content.
    const gitHubInfo = fromContentUri(path);
    if (gitHubInfo) {
      const rawUrl = toRawContentUri(gitHubInfo.owner, gitHubInfo.repo, gitHubInfo.branch, gitHubInfo.path);
      const response = await fetch(rawUrl);
      if (response.status === Constants.HttpStatusCodes.OK) {
        this.notebookToImport = {
          name: NotebookUtil.getName(path),
          content: await response.text(),
        };

        this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
      }
    }
  }

  public openUploadItemsPane(onUpload?: (data: UploadDetailsRecord[]) => void): void {
    useSidePanel.getState().openSidePanel("Upload " + getUploadName(), <UploadItemsPane onUpload={onUpload} />);
  }
  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    useSidePanel
      .getState()
      .openSidePanel("Input parameters", <ExecuteSprocParamsPane storedProcedure={storedProcedure} />);
  }

  public getDownloadModalContent(fileName: string): JSX.Element {
    if (useNotebook.getState().isPhoenixNotebooks) {
      return (
        <>
          <p>{Notebook.galleryNotebookDownloadContent1}</p>
          <br />
          <p>
            {Notebook.galleryNotebookDownloadContent2}
            <Link href={Notebook.cosmosNotebookGitDocumentationUrl} target="_blank">
              {Notebook.learnMore}
            </Link>
          </p>
        </>
      );
    }
    return <p> Download {fileName} from gallery as a copy to your notebooks to run and/or edit the notebook. </p>;
  }

  public async refreshExplorer(): Promise<void> {
    if (userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo") {
      userContext.authType === AuthType.ResourceToken
        ? this.refreshDatabaseForResourceToken()
        : await this.refreshAllDatabases(); // await: we rely on the databases to be loaded before restoring the tabs further in the flow
    }

    if (!isFabricNative()) {
      await useNotebook.getState().refreshNotebooksEnabledStateForAccount();
    }

    // TODO: remove reference to isNotebookEnabled and isNotebooksEnabledForAccount
    const isNotebookEnabled =
      configContext.platform !== Platform.Fabric &&
      (userContext.features.notebooksDownBanner ||
        useNotebook.getState().isPhoenixNotebooks ||
        useNotebook.getState().isPhoenixFeatures);
    useNotebook.getState().setIsNotebookEnabled(isNotebookEnabled);
    useNotebook
      .getState()
      .setIsShellEnabled(useNotebook.getState().isPhoenixFeatures && isPublicInternetAccessAllowed());

    TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
      isNotebookEnabled,
      dataExplorerArea: Constants.Areas.Notebook,
    });

    if (useNotebook.getState().isPhoenixNotebooks) {
      await this.initNotebooks(userContext.databaseAccount);
    }

    if (userContext.authType === AuthType.AAD && userContext.apiType === "SQL" && !isFabricNative()) {
      const throughputBucketsEnabled = await featureRegistered(userContext.subscriptionId, "ThroughputBucketing");
      updateUserContext({ throughputBucketsEnabled });
    }

    this.refreshSampleData();
  }

  public async configureCopilot(): Promise<void> {
    if (
      userContext.apiType !== "SQL" ||
      !userContext.subscriptionId ||
      ![Environment.Development, Environment.Mpac, Environment.Prod].includes(getEnvironment())
    ) {
      return;
    }
    const copilotEnabledPromise = getCopilotEnabled();
    const copilotUserDBEnabledPromise = isCopilotFeatureRegistered(userContext.subscriptionId);
    const [copilotEnabled, copilotUserDBEnabled] = await Promise.all([
      copilotEnabledPromise,
      copilotUserDBEnabledPromise,
    ]);
    const copilotSampleDBEnabled = LocalStorageUtility.getEntryString(StorageKey.CopilotSampleDBEnabled) === "true";
    useQueryCopilot.getState().setCopilotEnabled(copilotEnabled && copilotUserDBEnabled);
    useQueryCopilot.getState().setCopilotUserDBEnabled(copilotUserDBEnabled);
    useQueryCopilot
      .getState()
      .setCopilotSampleDBEnabled(copilotEnabled && copilotUserDBEnabled && copilotSampleDBEnabled);
  }

  public refreshSampleData(): void {
    if (!userContext.sampleDataConnectionInfo) {
      return;
    }

    const databaseId = userContext.sampleDataConnectionInfo?.databaseId;
    if (!databaseId) {
      return;
    }

    readSampleCollection()
      .then((collection: DataModels.Collection) => {
        if (!collection) {
          return;
        }

        const sampleDataResourceTokenCollection = new ResourceTokenCollection(this, databaseId, collection, true);
        useDatabases.setState({ sampleDataResourceTokenCollection });
      })
      .catch((error) => {
        Logger.logError(getErrorMessage(error), "Explorer/refreshSampleData");
      });
  }
}
