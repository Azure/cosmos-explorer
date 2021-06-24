import { IChoiceGroupProps } from "@fluentui/react";
import * as ko from "knockout";
import Q from "q";
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
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
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
import { AddCollectionPanel } from "./Panes/AddCollectionPanel";
import { AddDatabasePanel } from "./Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "./Panes/BrowseQueriesPane/BrowseQueriesPane";
import { CassandraAddCollectionPane } from "./Panes/CassandraAddCollectionPane/CassandraAddCollectionPane";
import { DeleteCollectionConfirmationPane } from "./Panes/DeleteCollectionConfirmationPane/DeleteCollectionConfirmationPane";
import { DeleteDatabaseConfirmationPanel } from "./Panes/DeleteDatabaseConfirmationPanel";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane/ExecuteSprocParamsPane";
import { GitHubReposPanel } from "./Panes/GitHubReposPanel/GitHubReposPanel";
import { SaveQueryPane } from "./Panes/SaveQueryPane/SaveQueryPane";
import { SetupNoteBooksPanel } from "./Panes/SetupNotebooksPanel/SetupNotebooksPanel";
import { StringInputPane } from "./Panes/StringInputPane/StringInputPane";
import { UploadFilePane } from "./Panes/UploadFilePane/UploadFilePane";
import { UploadItemsPane } from "./Panes/UploadItemsPane/UploadItemsPane";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import NotebookV2Tab, { NotebookTabOptions } from "./Tabs/NotebookV2Tab";
import { TabsManager } from "./Tabs/TabsManager";
import TerminalTab from "./Tabs/TerminalTab";
import Database from "./Tree/Database";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import { ResourceTreeAdapterForResourceToken } from "./Tree/ResourceTreeAdapterForResourceToken";
import StoredProcedure from "./Tree/StoredProcedure";
import { useDatabases } from "./useDatabases";

BindingHandlersRegisterer.registerBindingHandlers();
// Hold a reference to ComponentRegisterer to prevent transpiler to ignore import
var tmp = ComponentRegisterer;

export interface ExplorerParams {
  tabsManager: TabsManager;
}

export default class Explorer {
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public isAccountReady: ko.Observable<boolean>;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;

  // Resource Tree
  public selectedDatabaseId: ko.Computed<string>;
  public selectedCollectionId: ko.Computed<string>;
  public selectedNode: ko.Observable<ViewModels.TreeNode>;
  private resourceTree: ResourceTreeAdapter;

  // Resource Token
  public resourceTokenCollection: ko.Observable<ViewModels.CollectionBase>;
  public isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;
  public resourceTreeForResourceToken: ResourceTreeAdapterForResourceToken;

  // Tabs
  public isTabsContentExpanded: ko.Observable<boolean>;
  public tabsManager: TabsManager;

  public gitHubOAuthService: GitHubOAuthService;
  public isSchemaEnabled: ko.Computed<boolean>;

  // Notebooks
  public isNotebookEnabled: ko.Observable<boolean>;
  public isNotebooksEnabledForAccount: ko.Observable<boolean>;
  public notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>;
  public sparkClusterConnectionInfo: ko.Observable<DataModels.SparkClusterConnectionInfo>;
  public isSynapseLinkUpdating: ko.Observable<boolean>;
  public memoryUsageInfo: ko.Observable<DataModels.MemoryUsageInfo>;
  public notebookManager?: NotebookManager;

  public isShellEnabled: ko.Observable<boolean>;

  private _isInitializingNotebooks: boolean;
  private notebookBasePath: ko.Observable<string>;
  private notebookToImport: {
    name: string;
    content: string;
  };

  private static readonly MaxNbDatabasesToAutoExpand = 5;

  constructor(params?: ExplorerParams) {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    this.isAccountReady = ko.observable<boolean>(false);
    this._isInitializingNotebooks = false;
    this.isShellEnabled = ko.observable(false);
    this.isNotebooksEnabledForAccount = ko.observable(false);
    this.isNotebooksEnabledForAccount.subscribe((isEnabledForAccount: boolean) => this.refreshCommandBarButtons());
    this.isSynapseLinkUpdating = ko.observable<boolean>(false);
    this.isAccountReady.subscribe(async (isAccountReady: boolean) => {
      if (isAccountReady) {
        userContext.authType === AuthType.ResourceToken
          ? this.refreshDatabaseForResourceToken()
          : this.refreshAllDatabases(true);
        await this._refreshNotebooksEnabledStateForAccount();
        this.isNotebookEnabled(
          userContext.authType !== AuthType.ResourceToken &&
            ((await this._containsDefaultNotebookWorkspace(userContext.databaseAccount)) ||
              userContext.features.enableNotebooks)
        );

        this.isShellEnabled(this.isNotebookEnabled() && isPublicInternetAccessAllowed());

        TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
          isNotebookEnabled: this.isNotebookEnabled(),
          dataExplorerArea: Constants.Areas.Notebook,
        });

        if (this.isNotebookEnabled()) {
          await this.initNotebooks(userContext.databaseAccount);
        } else if (this.notebookToImport) {
          // if notebooks is not enabled but the user is trying to do a quickstart setup with notebooks, open the SetupNotebooksPane
          this._openSetupNotebooksPaneForQuickstart();
        }
      }
    });
    this.memoryUsageInfo = ko.observable<DataModels.MemoryUsageInfo>();

    this.queriesClient = new QueriesClient(this);
    this.resourceTokenCollection = ko.observable<ViewModels.CollectionBase>();
    this.isSchemaEnabled = ko.computed<boolean>(() => userContext.features.enableSchema);

    this.selectedNode = ko.observable<ViewModels.TreeNode>();
    this.selectedNode.subscribe((nodeSelected: ViewModels.TreeNode) => {
      // Make sure switching tabs restores tabs display
      this.isTabsContentExpanded(false);
    });
    this.isResourceTokenCollectionNodeSelected = ko.computed<boolean>(() => {
      return (
        this.selectedNode() &&
        this.resourceTokenCollection() &&
        this.selectedNode().id() === this.resourceTokenCollection().id()
      );
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
    this.selectedDatabaseId = ko.computed<string>(() => {
      const selectedNode = this.selectedNode();
      if (!selectedNode) {
        return "";
      }

      switch (selectedNode.nodeKind) {
        case "Collection":
          return (selectedNode as ViewModels.CollectionBase).databaseId || "";
        case "Database":
          return selectedNode.id() || "";
        case "DocumentId":
        case "StoredProcedure":
        case "Trigger":
        case "UserDefinedFunction":
          return selectedNode.collection.databaseId || "";
        default:
          return "";
      }
    });

    this.tabsManager = params?.tabsManager ?? new TabsManager();
    this.tabsManager.openedTabs.subscribe((tabs) => {
      if (tabs.length === 0) {
        this.selectedNode(undefined);
        useCommandBar.getState().setContextButtons([]);
      }
    });

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

    this.isNotebookEnabled = ko.observable(false);
    this.isNotebookEnabled.subscribe(async () => {
      if (!this.notebookManager) {
        const NotebookManager = await (
          await import(/* webpackChunkName: "NotebookManager" */ "./Notebook/NotebookManager")
        ).default;
        this.notebookManager = new NotebookManager();
        this.notebookManager.initialize({
          container: this,
          notebookBasePath: this.notebookBasePath,
          resourceTree: this.resourceTree,
          refreshCommandBarButtons: () => this.refreshCommandBarButtons(),
          refreshNotebookList: () => this.refreshNotebookList(),
        });
      }

      this.refreshCommandBarButtons();
      this.refreshNotebookList();
    });

    this.resourceTree = new ResourceTreeAdapter(this);
    this.resourceTreeForResourceToken = new ResourceTreeAdapterForResourceToken(this);
    this.notebookServerInfo = ko.observable<DataModels.NotebookWorkspaceConnectionInfo>({
      notebookServerEndpoint: undefined,
      authToken: undefined,
    });
    this.notebookBasePath = ko.observable(Constants.Notebook.defaultBasePath);
    this.sparkClusterConnectionInfo = ko.observable<DataModels.SparkClusterConnectionInfo>({
      userName: undefined,
      password: undefined,
      endpoints: [],
    });

    // Override notebook server parameters from URL parameters
    if (userContext.features.notebookServerUrl && userContext.features.notebookServerToken) {
      this.notebookServerInfo({
        notebookServerEndpoint: userContext.features.notebookServerUrl,
        authToken: userContext.features.notebookServerToken,
      });
    }

    if (userContext.features.notebookBasePath) {
      this.notebookBasePath(userContext.features.notebookBasePath);
    }

    if (userContext.features.livyEndpoint) {
      this.sparkClusterConnectionInfo({
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
    this.isAccountReady(true);
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
        this.isSynapseLinkUpdating(true);
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
          this.isSynapseLinkUpdating(false);
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

  public isDatabaseNodeOrNoneSelected(): boolean {
    return this.isNoneSelected() || this.isDatabaseNodeSelected();
  }

  public isDatabaseNodeSelected(): boolean {
    return (this.selectedNode() && this.selectedNode().nodeKind === "Database") || false;
  }

  public isNodeKindSelected(nodeKind: string): boolean {
    return (this.selectedNode() && this.selectedNode().nodeKind === nodeKind) || false;
  }

  public isNoneSelected(): boolean {
    return this.selectedNode() == null;
  }

  public refreshDatabaseForResourceToken(): Promise<void> {
    const databaseId = userContext.parsedResourceToken?.databaseId;
    const collectionId = userContext.parsedResourceToken?.collectionId;
    if (!databaseId || !collectionId) {
      return Promise.reject();
    }

    return readCollection(databaseId, collectionId).then((collection: DataModels.Collection) => {
      this.resourceTokenCollection(new ResourceTokenCollection(this, databaseId, collection));
      this.selectedNode(this.resourceTokenCollection());
    });
  }

  public refreshAllDatabases(isInitialLoad?: boolean): Q.Promise<any> {
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    let resourceTreeStartKey: number = null;
    if (isInitialLoad) {
      resourceTreeStartKey = TelemetryProcessor.traceStart(Action.LoadResourceTree, {
        dataExplorerArea: Constants.Areas.ResourceTree,
      });
    }

    // TODO: Refactor
    const deferred: Q.Deferred<any> = Q.defer();
    readDatabases().then(
      (databases: DataModels.Database[]) => {
        TelemetryProcessor.traceSuccess(
          Action.LoadDatabases,
          {
            dataExplorerArea: Constants.Areas.ResourceTree,
          },
          startKey
        );
        const currentlySelectedNode: ViewModels.TreeNode = this.selectedNode();
        const deltaDatabases = this.getDeltaDatabases(databases);
        this.addDatabasesToList(deltaDatabases.toAdd);
        this.deleteDatabasesFromList(deltaDatabases.toDelete);
        this.selectedNode(currentlySelectedNode);
        this.refreshAndExpandNewDatabases(deltaDatabases.toAdd).then(
          () => {
            deferred.resolve();
          },
          (reason) => {
            deferred.reject(reason);
          }
        );
      },
      (error) => {
        deferred.reject(error);
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
    );

    return deferred.promise.then(
      () => {
        if (resourceTreeStartKey != null) {
          TelemetryProcessor.traceSuccess(
            Action.LoadResourceTree,
            {
              dataExplorerArea: Constants.Areas.ResourceTree,
            },
            resourceTreeStartKey
          );
        }
      },
      (error) => {
        if (resourceTreeStartKey != null) {
          TelemetryProcessor.traceFailure(
            Action.LoadResourceTree,
            {
              dataExplorerArea: Constants.Areas.ResourceTree,
              error: getErrorMessage(error),
              errorStack: getErrorStack(error),
            },
            resourceTreeStartKey
          );
        }
      }
    );
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

    this.notebookServerInfo({
      notebookServerEndpoint: userContext.features.notebookServerUrl || connectionInfo.notebookServerEndpoint,
      authToken: userContext.features.notebookServerToken || connectionInfo.authToken,
    });
    this.notebookServerInfo.valueHasMutated();
    this.refreshNotebookList();

    this._isInitializingNotebooks = false;
  }

  public resetNotebookWorkspace() {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookClient) {
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

  public findSelectedDatabase(): ViewModels.Database {
    if (!this.selectedNode()) {
      return null;
    }
    if (this.selectedNode().nodeKind === "Database") {
      return _.find(
        useDatabases.getState().databases,
        (database: ViewModels.Database) => database.id() === this.selectedNode().id()
      );
    }
    return this.findSelectedCollection().database;
  }

  public isSelectedDatabaseShared(): boolean {
    const database = this.findSelectedDatabase();
    if (!!database) {
      return database.offer && !!database.offer();
    }

    return false;
  }

  public findSelectedCollection(): ViewModels.Collection {
    return (this.selectedNode().nodeKind === "Collection"
      ? this.selectedNode()
      : this.selectedNode().collection) as ViewModels.Collection;
  }

  private refreshAndExpandNewDatabases(newDatabases: ViewModels.Database[]): Q.Promise<void> {
    // we reload collections for all databases so the resource tree reflects any collection-level changes
    // i.e addition of stored procedures, etc.
    const deferred: Q.Deferred<void> = Q.defer<void>();
    let loadCollectionPromises: Q.Promise<void>[] = [];

    // If the user has a lot of databases, only load expanded databases.
    const databases = useDatabases.getState().databases;
    const databasesToLoad =
      databases.length <= Explorer.MaxNbDatabasesToAutoExpand
        ? databases
        : databases.filter((db) => db.isDatabaseExpanded() || db.id() === Constants.SavedQueries.DatabaseName);

    const startKey: number = TelemetryProcessor.traceStart(Action.LoadCollections, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    databasesToLoad.forEach(async (database: ViewModels.Database) => {
      await database.loadCollections();
      const isNewDatabase: boolean = _.some(newDatabases, (db: ViewModels.Database) => db.id() === database.id());
      if (isNewDatabase) {
        database.expandDatabase();
      }
      this.tabsManager.refreshActiveTab((tab) => tab.collection && tab.collection.getDatabase().id() === database.id());
    });

    Q.all(loadCollectionPromises).done(
      () => {
        deferred.resolve();
        TelemetryProcessor.traceSuccess(
          Action.LoadCollections,
          { dataExplorerArea: Constants.Areas.ResourceTree },
          startKey
        );
      },
      (error: any) => {
        deferred.reject(error);
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
    );
    return deferred.promise;
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    }
  }

  private getDeltaDatabases(
    updatedDatabaseList: DataModels.Database[]
  ): {
    toAdd: ViewModels.Database[];
    toDelete: ViewModels.Database[];
  } {
    const databases = useDatabases.getState().databases;
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

    let databasesToDelete: ViewModels.Database[] = [];
    ko.utils.arrayForEach(databases, (database: ViewModels.Database) => {
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

  private addDatabasesToList(databases: ViewModels.Database[]): void {
    useDatabases.getState().addDatabases(databases);
  }

  private deleteDatabasesFromList(databasesToRemove: ViewModels.Database[]): void {
    const deleteDatabase = useDatabases.getState().deleteDatabase;
    databasesToRemove.forEach((database) => deleteDatabase(database));
  }

  public uploadFile(name: string, content: string, parent: NotebookContentItem): Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
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

    if (parent && parent.children && this.isNotebookEnabled() && this.notebookManager?.notebookClient) {
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

    if (parent && parent.children && this.isNotebookEnabled() && this.notebookManager?.notebookClient) {
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

    const notebookTabs = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.NotebookV2,
      (tab) =>
        (tab as NotebookV2Tab).notebookPath &&
        FileSystemUtil.isPathEqual((tab as NotebookV2Tab).notebookPath(), notebookContentItem.path)
    ) as NotebookV2Tab[];
    let notebookTab = notebookTabs && notebookTabs[0];

    if (notebookTab) {
      this.tabsManager.activateTab(notebookTab);
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
        this.tabsManager.activateNewTab(notebookTab);
      } catch (reason) {
        console.error("Import NotebookV2Tab failed!", reason);
        return false;
      }
    }

    return true;
  }

  public renameNotebook(notebookFile: NotebookContentItem): void {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to rename notebook, but notebook is not enabled";
      handleError(error, "Explorer/renameNotebook");
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.NotebookV2,
      (tab: NotebookV2Tab) => {
        return tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), notebookFile.path);
      }
    );
    if (openedNotebookTabs.length > 0) {
      this.showOkModalDialog("Unable to rename file", "This file is being edited. Please close the tab and try again.");
    } else {
      useSidePanel.getState().openSidePanel(
        "Rename Notebook",
        <StringInputPane
          explorer={this}
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to create notebook directory, but notebook is not enabled";
      handleError(error, "Explorer/onCreateDirectory");
      throw new Error(error);
    }

    useSidePanel.getState().openSidePanel(
      "Create new directory",
      <StringInputPane
        explorer={this}
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to read file, but notebook is not enabled";
      handleError(error, "Explorer/downloadFile");
      throw new Error(error);
    }

    return this.notebookManager?.notebookContentClient.readFileContent(notebookFile.path);
  }

  public downloadFile(notebookFile: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
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

  private async _refreshNotebooksEnabledStateForAccount(): Promise<void> {
    const { databaseAccount, authType } = userContext;
    if (
      authType === AuthType.EncryptedToken ||
      authType === AuthType.ResourceToken ||
      authType === AuthType.MasterKey
    ) {
      this.isNotebooksEnabledForAccount(false);
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
        this.isNotebooksEnabledForAccount(true);
        return;
      }

      // firstWriteLocation should not be disallowed
      const isAccountInAllowedLocation = firstWriteLocation && disallowedLocations.indexOf(firstWriteLocation) === -1;
      this.isNotebooksEnabledForAccount(isAccountInAllowedLocation);
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/isNotebooksEnabledForAccount");
      this.isNotebooksEnabledForAccount(false);
    }
  }

  private refreshNotebookList = async (): Promise<void> => {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      return;
    }

    await this.resourceTree.initialize();
    this.notebookManager?.refreshPinnedRepos();
    if (this.notebookToImport) {
      this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
    }
  };

  public deleteNotebookFile(item: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to delete notebook file, but notebook is not enabled";
      handleError(error, "Explorer/deleteNotebookFile");
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.NotebookV2,
      (tab: NotebookV2Tab) => {
        return tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), item.path);
      }
    );
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      handleError(error, "Explorer/refreshContentItem");
      return Promise.reject(new Error(error));
    }

    return this.notebookManager?.notebookContentClient.updateItemChildren(item);
  }

  public getNotebookBasePath(): string {
    return this.notebookBasePath();
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

    const terminalTabs: TerminalTab[] = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Terminal,
      (tab) => tab.tabTitle() === title
    ) as TerminalTab[];

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

    this.tabsManager.activateNewTab(newTab);
  }

  public async openGallery(
    selectedTab?: GalleryTabKind,
    notebookUrl?: string,
    galleryItem?: IGalleryItem,
    isFavorite?: boolean
  ) {
    const title = "Gallery";
    const GalleryTab = await (await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab")).default;
    const galleryTab = this.tabsManager
      .getTabs(ViewModels.CollectionTabKind.Gallery)
      .find((tab) => tab.tabTitle() == title);

    if (galleryTab instanceof GalleryTab) {
      this.tabsManager.activateTab(galleryTab);
    } else {
      this.tabsManager.activateNewTab(
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

  public onNewCollectionClicked(databaseId?: string): void {
    if (userContext.apiType === "Cassandra") {
      useSidePanel
        .getState()
        .openSidePanel(
          "Add Table",
          <CassandraAddCollectionPane explorer={this} cassandraApiClient={new CassandraAPIDataClient()} />
        );
    } else {
      this.openAddCollectionPanel(databaseId);
    }
  }

  private refreshCommandBarButtons(): void {
    const activeTab = this.tabsManager.activeTab();
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
    if (this.isAccountReady() && !(await this._containsDefaultNotebookWorkspace(userContext.databaseAccount))) {
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

  public openDeleteCollectionConfirmationPane(): void {
    useSidePanel
      .getState()
      .openSidePanel("Delete " + getCollectionName(), <DeleteCollectionConfirmationPane explorer={this} />);
  }

  public openDeleteDatabaseConfirmationPane(): void {
    useSidePanel
      .getState()
      .openSidePanel(
        "Delete " + getDatabaseName(),
        <DeleteDatabaseConfirmationPanel explorer={this} selectedDatabase={this.findSelectedDatabase()} />
      );
  }
  public openUploadItemsPanePane(): void {
    useSidePanel.getState().openSidePanel("Upload " + getUploadName(), <UploadItemsPane explorer={this} />);
  }
  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    useSidePanel
      .getState()
      .openSidePanel("Input parameters", <ExecuteSprocParamsPane storedProcedure={storedProcedure} />);
  }

  public async openAddCollectionPanel(databaseId?: string): Promise<void> {
    await useDatabases.getState().loadDatabaseOffers();
    useSidePanel
      .getState()
      .openSidePanel("New " + getCollectionName(), <AddCollectionPanel explorer={this} databaseId={databaseId} />);
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
}
