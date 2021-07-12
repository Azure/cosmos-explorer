import { IChoiceGroupProps } from "@fluentui/react";
import * as ko from "knockout";
import React from "react";
import _ from "underscore";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import * as Constants from "../Common/Constants";
import { readCollection } from "../Common/dataAccess/readCollection";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import { isPublicInternetAccessAllowed } from "../Common/DatabaseAccountUtility";
import { getErrorMessage, getErrorStack, handleError } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { QueriesClient } from "../Common/QueriesClient";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { useSidePanel } from "../hooks/useSidePanel";
import { useTabs } from "../hooks/useTabs";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import { ExplorerSettings } from "../Shared/ExplorerSettings";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../UserContext";
import { getCollectionName, getDatabaseName, getUploadName } from "../Utils/APITypeUtils";
import { update } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import {
  get as getWorkspace,
  listByDatabaseAccount,
  listConnectionInfo,
  start,
} from "../Utils/arm/generatedClients/cosmosNotebooks/notebookWorkspaces";
import { stringToBlob } from "../Utils/BlobUtils";
import { isCapabilityEnabled } from "../Utils/CapabilityUtils";
import { fromContentUri, toRawContentUri } from "../Utils/GitHubUtils";
import * as NotificationConsoleUtils from "../Utils/NotificationConsoleUtils";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import * as ComponentRegisterer from "./ComponentRegisterer";
import { DialogProps, TextFieldProps, useDialog } from "./Controls/Dialog";
import { GalleryTab as GalleryTabKind } from "./Controls/NotebookGallery/GalleryViewerComponent";
import { useCommandBar } from "./Menus/CommandBar/CommandBarComponentAdapter";
import * as FileSystemUtil from "./Notebook/FileSystemUtil";
import { SnapshotRequest } from "./Notebook/NotebookComponent/types";
import { NotebookContentItem, NotebookContentItemType } from "./Notebook/NotebookContentItem";
import type NotebookManager from "./Notebook/NotebookManager";
import type { NotebookPaneContent } from "./Notebook/NotebookManager";
import { NotebookUtil } from "./Notebook/NotebookUtil";
import { useNotebook } from "./Notebook/useNotebook";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel";
import { AddDatabasePanel } from "./Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "./Panes/BrowseQueriesPane/BrowseQueriesPane";
import { CassandraAddCollectionPane } from "./Panes/CassandraAddCollectionPane/CassandraAddCollectionPane";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane/ExecuteSprocParamsPane";
import { GitHubReposPanel } from "./Panes/GitHubReposPanel/GitHubReposPanel";
import { SaveQueryPane } from "./Panes/SaveQueryPane/SaveQueryPane";
import { SetupNoteBooksPanel } from "./Panes/SetupNotebooksPanel/SetupNotebooksPanel";
import { StringInputPane } from "./Panes/StringInputPane/StringInputPane";
import { UploadFilePane } from "./Panes/UploadFilePane/UploadFilePane";
import { UploadItemsPane } from "./Panes/UploadItemsPane/UploadItemsPane";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import NotebookV2Tab, { NotebookTabOptions } from "./Tabs/NotebookV2Tab";
import TabsBase from "./Tabs/TabsBase";
import TerminalTab from "./Tabs/TerminalTab";
import Database from "./Tree/Database";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import { ResourceTreeAdapterForResourceToken } from "./Tree/ResourceTreeAdapterForResourceToken";
import StoredProcedure from "./Tree/StoredProcedure";
import { useDatabases } from "./useDatabases";
import { useSelectedNode } from "./useSelectedNode";

BindingHandlersRegisterer.registerBindingHandlers();
// Hold a reference to ComponentRegisterer to prevent transpiler to ignore import
var tmp = ComponentRegisterer;

export default class Explorer {
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;

  // Resource Tree
  private resourceTree: ResourceTreeAdapter;

  // Resource Token
  public resourceTreeForResourceToken: ResourceTreeAdapterForResourceToken;

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

  constructor() {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    this._isInitializingNotebooks = false;
    useNotebook.subscribe(
      () => this.refreshCommandBarButtons(),
      (state) => state.isNotebooksEnabledForAccount
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
      (state) => state.openedTabs
    );

    this.isTabsContentExpanded = ko.observable(false);

    document.addEventListener(
      "contextmenu",
      function (e) {
        e.preventDefault();
      },
      false
    );

    $(function () {
      $(document.body).click(() => $(".commandDropdownContainer").hide());
    });

    switch (userContext.apiType) {
      case "Tables":
        this.tableDataClient = new TablesAPIDataClient();
        break;
      case "Cassandra":
        this.tableDataClient = new CassandraAPIDataClient();
        break;
    }

    this._initSettings();

    TelemetryProcessor.traceSuccess(
      Action.InitializeDataExplorer,
      { dataExplorerArea: Constants.Areas.ResourceTree },
      startKey
    );

    useNotebook.subscribe(
      async () => {
        if (!this.notebookManager) {
          const NotebookManager = await (
            await import(/* webpackChunkName: "NotebookManager" */ "./Notebook/NotebookManager")
          ).default;
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
      },
      (state) => state.isNotebookEnabled
    );

    this.resourceTree = new ResourceTreeAdapter(this);
    this.resourceTreeForResourceToken = new ResourceTreeAdapterForResourceToken(this);

    // Override notebook server parameters from URL parameters
    if (userContext.features.notebookServerUrl && userContext.features.notebookServerToken) {
      useNotebook.getState().setNotebookServerInfo({
        notebookServerEndpoint: userContext.features.notebookServerUrl,
        authToken: userContext.features.notebookServerToken,
      });
    }

    if (userContext.features.notebookBasePath) {
      useNotebook.getState().setNotebookBasePath(userContext.features.notebookBasePath);
    }

    if (userContext.features.livyEndpoint) {
      useNotebook.getState().setSparkClusterConnectionInfo({
        userName: undefined,
        password: undefined,
        endpoints: [
          {
            endpoint: userContext.features.livyEndpoint,
            kind: DataModels.SparkClusterEndpointKind.Livy,
          },
        ],
      });
    }

    if (configContext.enableSchemaAnalyzer) {
      userContext.features.enableSchemaAnalyzer = true;
    }

    this.refreshExplorer();
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
          "Enabling Azure Synapse Link for this account. This may take a few minutes before you can enable analytical store for this account."
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

    // TODO: return result
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
        startKey
      );
      const currentDatabases = useDatabases.getState().databases;
      const deltaDatabases = this.getDeltaDatabases(databases, currentDatabases);
      let updatedDatabases = currentDatabases.filter(
        (database) => !deltaDatabases.toDelete.some((deletedDatabase) => deletedDatabase.id() === database.id())
      );
      updatedDatabases = [...updatedDatabases, ...deltaDatabases.toAdd].sort((db1, db2) =>
        db1.id().localeCompare(db2.id())
      );
      useDatabases.setState({ databases: updatedDatabases });
      await this.refreshAndExpandNewDatabases(deltaDatabases.toAdd, currentDatabases);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      logConsoleError(`Error while refreshing databases: ${errorMessage}`);
    }
  }

  public onRefreshDatabasesKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onRefreshResourcesClick(source, null);
      return false;
    }
    return true;
  };

  public onRefreshResourcesClick = (source: any, event: MouseEvent): void => {
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      description: "Refresh button clicked",
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    userContext.authType === AuthType.ResourceToken
      ? this.refreshDatabaseForResourceToken()
      : this.refreshAllDatabases();
    this.refreshNotebookList();
  };

  // Facade
  public provideFeedbackEmail = () => {
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

    await this.ensureNotebookWorkspaceRunning();
    const connectionInfo = await listConnectionInfo(
      userContext.subscriptionId,
      userContext.resourceGroup,
      databaseAccount.name,
      "default"
    );

    useNotebook.getState().setNotebookServerInfo({
      notebookServerEndpoint: userContext.features.notebookServerUrl || connectionInfo.notebookServerEndpoint,
      authToken: userContext.features.notebookServerToken || connectionInfo.authToken,
    });
    this.refreshNotebookList();

    this._isInitializingNotebooks = false;
  }

  public resetNotebookWorkspace() {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookClient) {
      handleError(
        "Attempt to reset notebook workspace, but notebook is not enabled",
        "Explorer/resetNotebookWorkspace"
      );
      return;
    }

    const resetConfirmationDialogProps: DialogProps = {
      isModal: true,
      title: "Reset Workspace",
      subText: "This lets you keep your notebook files and the workspace will be restored to default. Proceed anyway?",
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
      onPrimaryButtonClick: this._resetNotebookWorkspace,
      onSecondaryButtonClick: () => useDialog.getState().closeDialog(),
    };
    useDialog.getState().openDialog(resetConfirmationDialogProps);
  }

  private async _containsDefaultNotebookWorkspace(databaseAccount: DataModels.DatabaseAccount): Promise<boolean> {
    if (!databaseAccount) {
      return false;
    }

    try {
      const { value: workspaces } = await listByDatabaseAccount(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name
      );
      return workspaces && workspaces.length > 0 && workspaces.some((workspace) => workspace.name === "default");
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/_containsDefaultNotebookWorkspace");
      return false;
    }
  }

  private async ensureNotebookWorkspaceRunning() {
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
      if (
        notebookWorkspace &&
        notebookWorkspace.properties &&
        notebookWorkspace.properties.status &&
        notebookWorkspace.properties.status.toLowerCase() === "stopped"
      ) {
        clearMessage = NotificationConsoleUtils.logConsoleProgress("Initializing notebook workspace");
        await start(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name, "default");
      }
    } catch (error) {
      handleError(error, "Explorer/ensureNotebookWorkspaceRunning", "Failed to initialize notebook workspace");
    } finally {
      clearMessage && clearMessage();
    }
  }

  private _resetNotebookWorkspace = async () => {
    useDialog.getState().closeDialog();
    const clearInProgressMessage = logConsoleProgress("Resetting notebook workspace");
    try {
      await this.notebookManager?.notebookClient.resetWorkspace();
      logConsoleInfo("Successfully reset notebook workspace");
      TelemetryProcessor.traceSuccess(Action.ResetNotebookWorkspace);
    } catch (error) {
      logConsoleError(`Failed to reset notebook workspace: ${error}`);
      TelemetryProcessor.traceFailure(Action.ResetNotebookWorkspace, {
        error: getErrorMessage(error),
        errorStack: getErrorStack(error),
      });
      throw error;
    } finally {
      clearInProgressMessage();
    }
  };

  private getDeltaDatabases(
    updatedDatabaseList: DataModels.Database[],
    databases: ViewModels.Database[]
  ): {
    toAdd: ViewModels.Database[];
    toDelete: ViewModels.Database[];
  } {
    const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
      const databaseExists = _.some(
        databases,
        (existingDatabase: ViewModels.Database) => existingDatabase.id() === database.id
      );
      return !databaseExists;
    });
    const databasesToAdd: ViewModels.Database[] = newDatabases.map(
      (newDatabase: DataModels.Database) => new Database(this, newDatabase)
    );

    const databasesToDelete: ViewModels.Database[] = [];
    databases.forEach((database: ViewModels.Database) => {
      const databasePresentInUpdatedList = _.some(
        updatedDatabaseList,
        (db: DataModels.Database) => db.id === database.id()
      );
      if (!databasePresentInUpdatedList) {
        databasesToDelete.push(database);
      }
    });

    return { toAdd: databasesToAdd, toDelete: databasesToDelete };
  }

  private async refreshAndExpandNewDatabases(
    newDatabases: ViewModels.Database[],
    databases: ViewModels.Database[]
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
          await database.loadCollections();
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
            startKey
          );
        })
      );
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.LoadCollections,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    }
  }

  public uploadFile(name: string, content: string, parent: NotebookContentItem): Promise<NotebookContentItem> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to upload notebook, but notebook is not enabled";
      handleError(error, "Explorer/uploadFile");
      throw new Error(error);
    }

    const promise = this.notebookManager?.notebookContentClient.uploadFileAsync(name, content, parent);
    promise
      .then(() => this.resourceTree.triggerRender())
      .catch((reason: any) => this.showOkModalDialog("Unable to upload file", reason));
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
    onClosePanel?: () => void
  ): Promise<void> {
    if (this.notebookManager) {
      await this.notebookManager.openPublishNotebookPane(
        name,
        content,
        notebookContentRef,
        onTakeSnapshot,
        onClosePanel
      );
    }
  }

  public copyNotebook(name: string, content: string): void {
    this.notebookManager?.openCopyNotebookPane(name, content);
  }

  public showOkModalDialog(title: string, msg: string): void {
    useDialog.getState().openDialog({
      isModal: true,
      title,
      subText: msg,
      primaryButtonText: "Close",
      secondaryButtonText: undefined,
      onPrimaryButtonClick: () => {
        useDialog.getState().closeDialog();
      },
      onSecondaryButtonClick: undefined,
    });
  }

  public showOkCancelModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    choiceGroupProps?: IChoiceGroupProps,
    textFieldProps?: TextFieldProps,
    isPrimaryButtonDisabled?: boolean
  ): void {
    useDialog.getState().openDialog({
      isModal: true,
      title,
      subText: msg,
      primaryButtonText: okLabel,
      secondaryButtonText: cancelLabel,
      onPrimaryButtonClick: () => {
        useDialog.getState().closeDialog();
        onOk && onOk();
      },
      onSecondaryButtonClick: () => {
        useDialog.getState().closeDialog();
        onCancel && onCancel();
      },
      choiceGroupProps,
      textFieldProps,
      primaryButtonDisabled: isPrimaryButtonDisabled,
    });
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

    const notebookTabs = useTabs
      .getState()
      .getTabs(
        ViewModels.CollectionTabKind.NotebookV2,
        (tab) =>
          (tab as NotebookV2Tab).notebookPath &&
          FileSystemUtil.isPathEqual((tab as NotebookV2Tab).notebookPath(), notebookContentItem.path)
      ) as NotebookV2Tab[];
    let notebookTab = notebookTabs && notebookTabs[0];

    if (notebookTab) {
      useTabs.getState().activateTab(notebookTab);
    } else {
      const options: NotebookTabOptions = {
        account: userContext.databaseAccount,
        tabKind: ViewModels.CollectionTabKind.NotebookV2,
        node: null,
        title: notebookContentItem.name,
        tabPath: notebookContentItem.path,
        collection: null,
        masterKey: userContext.masterKey || "",
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null,
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

  public renameNotebook(notebookFile: NotebookContentItem): void {
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
      this.showOkModalDialog("Unable to rename file", "This file is being edited. Please close the tab and try again.");
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
            this.notebookManager?.notebookContentClient.renameNotebook(notebookFile, input)
          }
          notebookFile={notebookFile}
        />
      );
    }
  }

  public onCreateDirectory(parent: NotebookContentItem): void {
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
          this.notebookManager?.notebookContentClient.createDirectory(notebookFile, input)
        }
        notebookFile={parent}
      />
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
      (error: any) => {
        logConsoleError(`Could not download notebook ${getErrorMessage(error)}`);
        clearMessage();
      }
    );
  }

  private refreshNotebookList = async (): Promise<void> => {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      return;
    }

    await this.resourceTree.initialize();
    this.notebookManager?.refreshPinnedRepos();
    if (this.notebookToImport) {
      this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
    }
  };

  public deleteNotebookFile(item: NotebookContentItem): Promise<void> {
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
      this.showOkModalDialog("Unable to delete file", "This file is being edited. Please close the tab and try again.");
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

    return this.notebookManager?.notebookContentClient.deleteContentItem(item).then(
      () => logConsoleInfo(`Successfully deleted: ${item.path}`),
      (reason: any) => logConsoleError(`Failed to delete "${item.path}": ${JSON.stringify(reason)}`)
    );
  }

  /**
   * This creates a new notebook file, then opens the notebook
   */
  public onNewNotebookClicked(parent?: NotebookContentItem): void {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to create new notebook, but notebook is not enabled";
      handleError(error, "Explorer/onNewNotebookClicked");
      throw new Error(error);
    }

    parent = parent || this.resourceTree.myNotebooksContentRoot;

    const clearInProgressMessage = logConsoleProgress(`Creating new notebook in ${parent.path}`);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateNewNotebook, {
      dataExplorerArea: Constants.Areas.Notebook,
    });

    this.notebookManager?.notebookContentClient
      .createNewNotebookFile(parent)
      .then((newFile: NotebookContentItem) => {
        logConsoleInfo(`Successfully created: ${newFile.name}`);
        TelemetryProcessor.traceSuccess(
          Action.CreateNewNotebook,
          {
            dataExplorerArea: Constants.Areas.Notebook,
          },
          startKey
        );
        return this.openNotebook(newFile);
      })
      .then(() => this.resourceTree.triggerRender())
      .catch((error: any) => {
        const errorMessage = `Failed to create a new notebook: ${getErrorMessage(error)}`;
        logConsoleError(errorMessage);
        TelemetryProcessor.traceFailure(
          Action.CreateNewNotebook,
          {
            dataExplorerArea: Constants.Areas.Notebook,
            error: errorMessage,
            errorStack: getErrorStack(error),
          },
          startKey
        );
      })
      .finally(clearInProgressMessage);
  }

  public refreshContentItem(item: NotebookContentItem): Promise<void> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      handleError(error, "Explorer/refreshContentItem");
      return Promise.reject(new Error(error));
    }

    return this.notebookManager?.notebookContentClient.updateItemChildren(item);
  }

  public openNotebookTerminal(kind: ViewModels.TerminalKind) {
    let title: string;

    switch (kind) {
      case ViewModels.TerminalKind.Default:
        title = "Terminal";
        break;

      case ViewModels.TerminalKind.Mongo:
        title = "Mongo Shell";
        break;

      case ViewModels.TerminalKind.Cassandra:
        title = "Cassandra Shell";
        break;

      default:
        throw new Error("Terminal kind: ${kind} not supported");
    }

    const terminalTabs: TerminalTab[] = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Terminal, (tab) => tab.tabTitle() === title) as TerminalTab[];

    let index = 1;
    if (terminalTabs.length > 0) {
      index = terminalTabs[terminalTabs.length - 1].index + 1;
    }

    const newTab = new TerminalTab({
      account: userContext.databaseAccount,
      tabKind: ViewModels.CollectionTabKind.Terminal,
      node: null,
      title: `${title} ${index}`,
      tabPath: `${title} ${index}`,
      collection: null,
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
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
    isFavorite?: boolean
  ) {
    const title = "Gallery";
    const GalleryTab = await (await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab")).default;
    const galleryTab = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Gallery)
      .find((tab) => tab.tabTitle() == title);

    if (galleryTab instanceof GalleryTab) {
      useTabs.getState().activateTab(galleryTab);
    } else {
      useTabs.getState().activateNewTab(
        new GalleryTab(
          {
            tabKind: ViewModels.CollectionTabKind.Gallery,
            title,
            tabPath: title,
            onLoadStartKey: null,
            isTabsContentExpanded: ko.observable(true),
          },
          {
            account: userContext.databaseAccount,
            container: this,
            junoClient: this.notebookManager?.junoClient,
            selectedTab: selectedTab || GalleryTabKind.PublicGallery,
            notebookUrl,
            galleryItem,
            isFavorite,
          }
        )
      );
    }
  }

  public async onNewCollectionClicked(databaseId?: string): Promise<void> {
    if (userContext.apiType === "Cassandra") {
      useSidePanel
        .getState()
        .openSidePanel(
          "Add Table",
          <CassandraAddCollectionPane explorer={this} cassandraApiClient={new CassandraAPIDataClient()} />
        );
    } else {
      await useDatabases.getState().loadDatabaseOffers();
      useSidePanel
        .getState()
        .openSidePanel("New " + getCollectionName(), <AddCollectionPanel explorer={this} databaseId={databaseId} />);
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

  private _openSetupNotebooksPaneForQuickstart(): void {
    const title = "Enable Notebooks (Preview)";
    const description =
      "You have not yet created a notebooks workspace for this account. To proceed and start using notebooks, we'll need to create a default notebooks workspace in this account.";

    this.openSetupNotebooksPanel(title, description);
  }

  public async handleOpenFileAction(path: string): Promise<void> {
    if (!(await this._containsDefaultNotebookWorkspace(userContext.databaseAccount))) {
      this._openSetupNotebooksPaneForQuickstart();
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

  public openUploadItemsPanePane(): void {
    useSidePanel.getState().openSidePanel("Upload " + getUploadName(), <UploadItemsPane />);
  }
  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    useSidePanel
      .getState()
      .openSidePanel("Input parameters", <ExecuteSprocParamsPane storedProcedure={storedProcedure} />);
  }

  public openAddDatabasePane(): void {
    useSidePanel.getState().openSidePanel("New " + getDatabaseName(), <AddDatabasePanel explorer={this} />);
  }

  public openBrowseQueriesPanel(): void {
    useSidePanel.getState().openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={this} />);
  }

  public openSaveQueryPanel(): void {
    useSidePanel.getState().openSidePanel("Save Query", <SaveQueryPane explorer={this} />);
  }

  public openUploadFilePanel(parent?: NotebookContentItem): void {
    parent = parent || this.resourceTree.myNotebooksContentRoot;
    useSidePanel
      .getState()
      .openSidePanel(
        "Upload file to notebook server",
        <UploadFilePane uploadFile={(name: string, content: string) => this.uploadFile(name, content, parent)} />
      );
  }

  public openGitHubReposPanel(header: string, junoClient?: JunoClient): void {
    useSidePanel
      .getState()
      .openSidePanel(
        header,
        <GitHubReposPanel
          explorer={this}
          gitHubClientProp={this.notebookManager.gitHubClient}
          junoClientProp={junoClient}
        />
      );
  }

  public openSetupNotebooksPanel(title: string, description: string): void {
    useSidePanel
      .getState()
      .openSidePanel(title, <SetupNoteBooksPanel explorer={this} panelTitle={title} panelDescription={description} />);
  }

  public async refreshExplorer(): Promise<void> {
    userContext.authType === AuthType.ResourceToken
      ? this.refreshDatabaseForResourceToken()
      : this.refreshAllDatabases();
    await useNotebook.getState().refreshNotebooksEnabledStateForAccount();
    const isNotebookEnabled: boolean =
      userContext.authType !== AuthType.ResourceToken &&
      ((await this._containsDefaultNotebookWorkspace(userContext.databaseAccount)) ||
        userContext.features.enableNotebooks);
    useNotebook.getState().setIsNotebookEnabled(isNotebookEnabled);
    useNotebook.getState().setIsShellEnabled(isNotebookEnabled && isPublicInternetAccessAllowed());

    TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
      isNotebookEnabled,
      dataExplorerArea: Constants.Areas.Notebook,
    });

    if (isNotebookEnabled) {
      await this.initNotebooks(userContext.databaseAccount);
    } else if (this.notebookToImport) {
      // if notebooks is not enabled but the user is trying to do a quickstart setup with notebooks, open the SetupNotebooksPane
      this._openSetupNotebooksPaneForQuickstart();
    }
  }
}
