import { IChoiceGroupProps } from "@fluentui/react";
import * as ko from "knockout";
import Q from "q";
import React from "react";
import _ from "underscore";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import * as Constants from "../Common/Constants";
import { ExplorerMetrics, HttpStatusCodes } from "../Common/Constants";
import { readCollection } from "../Common/dataAccess/readCollection";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import { getErrorMessage, getErrorStack, handleError } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { sendCachedDataMessage } from "../Common/MessageHandler";
import { QueriesClient } from "../Common/QueriesClient";
import { Splitter, SplitterBounds, SplitterDirection } from "../Common/Splitter";
import { configContext, Platform } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import * as ViewModels from "../Contracts/ViewModels";
import { GitHubClient } from "../GitHub/GitHubClient";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import { NotebookWorkspaceManager } from "../NotebookWorkspaceManager/NotebookWorkspaceManager";
import { ResourceProviderClientFactory } from "../ResourceProvider/ResourceProviderClientFactory";
import { RouteHandler } from "../RouteHandlers/RouteHandler";
import { trackEvent } from "../Shared/appInsights";
import * as SharedConstants from "../Shared/Constants";
import { ExplorerSettings } from "../Shared/ExplorerSettings";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { ArcadiaResourceManager } from "../SparkClusterManager/ArcadiaResourceManager";
import { updateUserContext, userContext } from "../UserContext";
import { getCollectionName, getDatabaseName, getUploadName } from "../Utils/APITypeUtils";
import { decryptJWTToken, getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { stringToBlob } from "../Utils/BlobUtils";
import { isCapabilityEnabled } from "../Utils/CapabilityUtils";
import { fromContentUri, toRawContentUri } from "../Utils/GitHubUtils";
import * as NotificationConsoleUtils from "../Utils/NotificationConsoleUtils";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import * as ComponentRegisterer from "./ComponentRegisterer";
import { ArcadiaWorkspaceItem } from "./Controls/Arcadia/ArcadiaMenuPicker";
import { CommandButtonComponentProps } from "./Controls/CommandButton/CommandButtonComponent";
import { DialogProps, TextFieldProps } from "./Controls/Dialog";
import { GalleryTab as GalleryTabKind } from "./Controls/NotebookGallery/GalleryViewerComponent";
import { CommandBarComponentAdapter } from "./Menus/CommandBar/CommandBarComponentAdapter";
import { ConsoleData } from "./Menus/NotificationConsole/NotificationConsoleComponent";
import * as FileSystemUtil from "./Notebook/FileSystemUtil";
import { SnapshotRequest } from "./Notebook/NotebookComponent/types";
import { NotebookContentItem, NotebookContentItemType } from "./Notebook/NotebookContentItem";
import type NotebookManager from "./Notebook/NotebookManager";
import type { NotebookPaneContent } from "./Notebook/NotebookManager";
import { NotebookUtil } from "./Notebook/NotebookUtil";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel";
import { AddDatabasePanel } from "./Panes/AddDatabasePanel/AddDatabasePanel";
import { BrowseQueriesPane } from "./Panes/BrowseQueriesPane/BrowseQueriesPane";
import CassandraAddCollectionPane from "./Panes/CassandraAddCollectionPane";
import { ContextualPaneBase } from "./Panes/ContextualPaneBase";
import { DeleteCollectionConfirmationPane } from "./Panes/DeleteCollectionConfirmationPane/DeleteCollectionConfirmationPane";
import { DeleteDatabaseConfirmationPanel } from "./Panes/DeleteDatabaseConfirmationPanel";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane/ExecuteSprocParamsPane";
import { GitHubReposPanel } from "./Panes/GitHubReposPanel/GitHubReposPanel";
import { LoadQueryPane } from "./Panes/LoadQueryPane/LoadQueryPane";
import { SaveQueryPane } from "./Panes/SaveQueryPane/SaveQueryPane";
import { SettingsPane } from "./Panes/SettingsPane/SettingsPane";
import { SetupNoteBooksPanel } from "./Panes/SetupNotebooksPanel/SetupNotebooksPanel";
import { StringInputPane } from "./Panes/StringInputPane/StringInputPane";
import { AddTableEntityPanel } from "./Panes/Tables/AddTableEntityPanel";
import { EditTableEntityPanel } from "./Panes/Tables/EditTableEntityPanel";
import { TableQuerySelectPanel } from "./Panes/Tables/TableQuerySelectPanel";
import { UploadFilePane } from "./Panes/UploadFilePane/UploadFilePane";
import { UploadItemsPane } from "./Panes/UploadItemsPane/UploadItemsPane";
import TableListViewModal from "./Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "./Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import NotebookV2Tab, { NotebookTabOptions } from "./Tabs/NotebookV2Tab";
import QueryTablesTab from "./Tabs/QueryTablesTab";
import { TabsManager } from "./Tabs/TabsManager";
import TerminalTab from "./Tabs/TerminalTab";
import Database from "./Tree/Database";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import { ResourceTreeAdapterForResourceToken } from "./Tree/ResourceTreeAdapterForResourceToken";
import StoredProcedure from "./Tree/StoredProcedure";

BindingHandlersRegisterer.registerBindingHandlers();
// Hold a reference to ComponentRegisterer to prevent transpiler to ignore import
var tmp = ComponentRegisterer;

export interface ExplorerParams {
  setIsNotificationConsoleExpanded: (isExpanded: boolean) => void;
  setNotificationConsoleData: (consoleData: ConsoleData) => void;
  setInProgressConsoleDataIdToBeDeleted: (id: string) => void;
  openSidePanel: (headerText: string, panelContent: JSX.Element, onClose?: () => void) => void;
  closeSidePanel: () => void;
  closeDialog: () => void;
  openDialog: (props: DialogProps) => void;
  tabsManager: TabsManager;
}

export default class Explorer {
  public addCollectionText: ko.Observable<string>;
  public collectionTitle: ko.Observable<string>;
  public deleteCollectionText: ko.Observable<string>;
  public deleteDatabaseText: ko.Observable<string>;
  public collectionTreeNodeAltText: ko.Observable<string>;
  public refreshTreeTitle: ko.Observable<string>;
  public collapsedResourceTreeWidth: number = ExplorerMetrics.CollapsedResourceTreeWidth;

  public collectionCreationDefaults: ViewModels.CollectionCreationDefaults = SharedConstants.CollectionCreationDefaults;
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public isServerlessEnabled: ko.Computed<boolean>;
  public isAccountReady: ko.Observable<boolean>;
  public canSaveQueries: ko.Computed<boolean>;
  public features: ko.Observable<any>;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;
  public splitter: Splitter;

  // Notification Console
  private setIsNotificationConsoleExpanded: (isExpanded: boolean) => void;
  private setNotificationConsoleData: (consoleData: ConsoleData) => void;
  private setInProgressConsoleDataIdToBeDeleted: (id: string) => void;

  // Panes
  public contextPanes: ContextualPaneBase[];
  public openSidePanel: (headerText: string, panelContent: JSX.Element, onClose?: () => void) => void;
  public closeSidePanel: () => void;

  // Resource Tree
  public databases: ko.ObservableArray<ViewModels.Database>;
  public selectedDatabaseId: ko.Computed<string>;
  public selectedCollectionId: ko.Computed<string>;
  public selectedNode: ko.Observable<ViewModels.TreeNode>;
  private resourceTree: ResourceTreeAdapter;

  // Resource Token
  public resourceTokenDatabaseId: ko.Observable<string>;
  public resourceTokenCollectionId: ko.Observable<string>;
  public resourceTokenCollection: ko.Observable<ViewModels.CollectionBase>;
  public resourceTokenPartitionKey: ko.Observable<string>;
  public isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;
  public resourceTreeForResourceToken: ResourceTreeAdapterForResourceToken;

  // Tabs
  public isTabsContentExpanded: ko.Observable<boolean>;
  public tabsManager: TabsManager;

  // Contextual panes
  public cassandraAddCollectionPane: CassandraAddCollectionPane;
  private gitHubClient: GitHubClient;
  public gitHubOAuthService: GitHubOAuthService;
  public junoClient: JunoClient;

  // features
  public isPublishNotebookPaneEnabled: ko.Observable<boolean>;
  public isHostedDataExplorerEnabled: ko.Computed<boolean>;
  public isMongoIndexingEnabled: ko.Observable<boolean>;
  public canExceedMaximumValue: ko.Computed<boolean>;
  public isAutoscaleDefaultEnabled: ko.Observable<boolean>;
  public isSchemaEnabled: ko.Computed<boolean>;

  // Notebooks
  public isNotebookEnabled: ko.Observable<boolean>;
  public isNotebooksEnabledForAccount: ko.Observable<boolean>;
  public notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>;
  public notebookWorkspaceManager: NotebookWorkspaceManager;
  public sparkClusterConnectionInfo: ko.Observable<DataModels.SparkClusterConnectionInfo>;
  public isSparkEnabled: ko.Observable<boolean>;
  public isSparkEnabledForAccount: ko.Observable<boolean>;
  public arcadiaToken: ko.Observable<string>;
  public arcadiaWorkspaces: ko.ObservableArray<ArcadiaWorkspaceItem>;
  public hasStorageAnalyticsAfecFeature: ko.Observable<boolean>;
  public isSynapseLinkUpdating: ko.Observable<boolean>;
  public memoryUsageInfo: ko.Observable<DataModels.MemoryUsageInfo>;
  public notebookManager?: NotebookManager;
  public openDialog: ExplorerParams["openDialog"];
  public closeDialog: ExplorerParams["closeDialog"];

  private _isInitializingNotebooks: boolean;
  private notebookBasePath: ko.Observable<string>;
  private _arcadiaManager: ArcadiaResourceManager;
  private notebookToImport: {
    name: string;
    content: string;
  };

  // React adapters
  private commandBarComponentAdapter: CommandBarComponentAdapter;

  private static readonly MaxNbDatabasesToAutoExpand = 5;

  constructor(params?: ExplorerParams) {
    this.gitHubClient = new GitHubClient(this.onGitHubClientError);
    this.junoClient = new JunoClient();
    this.setIsNotificationConsoleExpanded = params?.setIsNotificationConsoleExpanded;
    this.setNotificationConsoleData = params?.setNotificationConsoleData;
    this.setInProgressConsoleDataIdToBeDeleted = params?.setInProgressConsoleDataIdToBeDeleted;
    this.openSidePanel = params?.openSidePanel;
    this.closeSidePanel = params?.closeSidePanel;
    this.closeDialog = params?.closeDialog;
    this.openDialog = params?.openDialog;

    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    this.addCollectionText = ko.observable<string>("New Collection");
    this.collectionTitle = ko.observable<string>("Collections");
    this.collectionTreeNodeAltText = ko.observable<string>("Collection");
    this.deleteCollectionText = ko.observable<string>("Delete Collection");
    this.deleteDatabaseText = ko.observable<string>("Delete Database");
    this.refreshTreeTitle = ko.observable<string>("Refresh collections");

    this.isAccountReady = ko.observable<boolean>(false);
    this._isInitializingNotebooks = false;
    this.arcadiaToken = ko.observable<string>();
    this.arcadiaToken.subscribe((token: string) => {
      if (token) {
        const notebookTabs = this.tabsManager.getTabs(ViewModels.CollectionTabKind.NotebookV2);
        (notebookTabs || []).forEach((tab: NotebookV2Tab) => {
          tab.reconfigureServiceEndpoints();
        });
      }
    });

    this.isNotebooksEnabledForAccount = ko.observable(false);
    this.isNotebooksEnabledForAccount.subscribe((isEnabledForAccount: boolean) => this.refreshCommandBarButtons());
    this.isSparkEnabledForAccount = ko.observable(false);
    this.isSparkEnabledForAccount.subscribe((isEnabledForAccount: boolean) => this.refreshCommandBarButtons());
    this.hasStorageAnalyticsAfecFeature = ko.observable(false);
    this.hasStorageAnalyticsAfecFeature.subscribe((enabled: boolean) => this.refreshCommandBarButtons());
    this.isSynapseLinkUpdating = ko.observable<boolean>(false);
    this.isAccountReady.subscribe(async (isAccountReady: boolean) => {
      if (isAccountReady) {
        userContext.authType === AuthType.ResourceToken
          ? this.refreshDatabaseForResourceToken()
          : this.refreshAllDatabases(true);
        RouteHandler.getInstance().initHandler();
        this.notebookWorkspaceManager = new NotebookWorkspaceManager();
        this.arcadiaWorkspaces = ko.observableArray();
        this._arcadiaManager = new ArcadiaResourceManager();
        this._isAfecFeatureRegistered(Constants.AfecFeatures.StorageAnalytics).then((isRegistered) =>
          this.hasStorageAnalyticsAfecFeature(isRegistered)
        );
        Promise.all([this._refreshNotebooksEnabledStateForAccount(), this._refreshSparkEnabledStateForAccount()]).then(
          async () => {
            this.isNotebookEnabled(
              userContext.authType !== AuthType.ResourceToken &&
                ((await this._containsDefaultNotebookWorkspace(userContext.databaseAccount)) ||
                  userContext.features.enableNotebooks)
            );
            TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
              isNotebookEnabled: this.isNotebookEnabled(),
              dataExplorerArea: Constants.Areas.Notebook,
            });

            if (this.isNotebookEnabled()) {
              await this.initNotebooks(userContext.databaseAccount);
              const workspaces = await this._getArcadiaWorkspaces();
              this.arcadiaWorkspaces(workspaces);
            } else if (this.notebookToImport) {
              // if notebooks is not enabled but the user is trying to do a quickstart setup with notebooks, open the SetupNotebooksPane
              this._openSetupNotebooksPaneForQuickstart();
            }

            this.isSparkEnabled(
              (this.isNotebookEnabled() &&
                this.isSparkEnabledForAccount() &&
                this.arcadiaWorkspaces() &&
                this.arcadiaWorkspaces().length > 0) ||
                userContext.features.enableSpark
            );
            if (this.isSparkEnabled()) {
              trackEvent(
                { name: "LoadedWithSparkEnabled" },
                {
                  subscriptionId: userContext.subscriptionId,
                  accountName: userContext.databaseAccount?.name,
                  accountId: userContext.databaseAccount?.id,
                  platform: configContext.platform,
                }
              );
              const pollArcadiaTokenRefresh = async () => {
                this.arcadiaToken(await this.getArcadiaToken());
                setTimeout(() => pollArcadiaTokenRefresh(), this.getTokenRefreshInterval(this.arcadiaToken()));
              };
              await pollArcadiaTokenRefresh();
            }
          }
        );
      }
    });
    this.memoryUsageInfo = ko.observable<DataModels.MemoryUsageInfo>();

    this.queriesClient = new QueriesClient(this);

    this.resourceTokenDatabaseId = ko.observable<string>();
    this.resourceTokenCollectionId = ko.observable<string>();
    this.resourceTokenCollection = ko.observable<ViewModels.CollectionBase>();
    this.resourceTokenPartitionKey = ko.observable<string>();
    this.isMongoIndexingEnabled = ko.observable<boolean>(false);
    this.isPublishNotebookPaneEnabled = ko.observable<boolean>(false);

    this.canExceedMaximumValue = ko.computed<boolean>(() => userContext.features.canExceedMaximumValue);

    this.isSchemaEnabled = ko.computed<boolean>(() => userContext.features.enableSchema);

    this.isAutoscaleDefaultEnabled = ko.observable<boolean>(false);

    this.databases = ko.observableArray<ViewModels.Database>();
    this.canSaveQueries = ko.computed<boolean>(() => {
      const savedQueriesDatabase: ViewModels.Database = _.find(
        this.databases(),
        (database: ViewModels.Database) => database.id() === Constants.SavedQueries.DatabaseName
      );
      if (!savedQueriesDatabase) {
        return false;
      }
      const savedQueriesCollection: ViewModels.Collection =
        savedQueriesDatabase &&
        _.find(
          savedQueriesDatabase.collections(),
          (collection: ViewModels.Collection) => collection.id() === Constants.SavedQueries.CollectionName
        );
      if (!savedQueriesCollection) {
        return false;
      }
      return true;
    });
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

    const splitterBounds: SplitterBounds = {
      min: ExplorerMetrics.SplitterMinWidth,
      max: ExplorerMetrics.SplitterMaxWidth,
    };
    this.splitter = new Splitter({
      splitterId: "h_splitter1",
      leftId: "resourcetree",
      bounds: splitterBounds,
      direction: SplitterDirection.Vertical,
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

    this.isServerlessEnabled = ko.computed(
      () =>
        userContext.databaseAccount?.properties?.capabilities?.find(
          (item) => item.name === Constants.CapabilityNames.EnableServerless
        ) !== undefined
    );

    this.isHostedDataExplorerEnabled = ko.computed<boolean>(
      () =>
        configContext.platform === Platform.Portal &&
        !this.isRunningOnNationalCloud() &&
        userContext.apiType !== "Gremlin"
    );
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

    this.cassandraAddCollectionPane = new CassandraAddCollectionPane({
      id: "cassandraaddcollectionpane",
      visible: ko.observable<boolean>(false),

      container: this,
    });

    this.tabsManager = params?.tabsManager ?? new TabsManager();
    this.tabsManager.openedTabs.subscribe((tabs) => {
      if (tabs.length === 0) {
        this.selectedNode(undefined);
        this.onUpdateTabsButtons([]);
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
      case "SQL":
        this.addCollectionText("New Container");
        this.collectionTitle("SQL API");
        this.collectionTreeNodeAltText("Container");
        this.deleteCollectionText("Delete Container");
        this.deleteDatabaseText("Delete Database");
        this.refreshTreeTitle("Refresh containers");
        break;
      case "Mongo":
        this.addCollectionText("New Collection");
        this.collectionTitle("Collections");
        this.collectionTreeNodeAltText("Collection");
        this.deleteCollectionText("Delete Collection");
        this.deleteDatabaseText("Delete Database");
        this.refreshTreeTitle("Refresh collections");
        break;
      case "Gremlin":
        this.addCollectionText("New Graph");
        this.deleteCollectionText("Delete Graph");
        this.deleteDatabaseText("Delete Database");
        this.collectionTitle("Gremlin API");
        this.collectionTreeNodeAltText("Graph");
        this.refreshTreeTitle("Refresh graphs");
        break;
      case "Tables":
        this.addCollectionText("New Table");
        this.deleteCollectionText("Delete Table");
        this.deleteDatabaseText("Delete Database");
        this.collectionTitle("Azure Table API");
        this.collectionTreeNodeAltText("Table");
        this.refreshTreeTitle("Refresh tables");
        this.tableDataClient = new TablesAPIDataClient();
        break;
      case "Cassandra":
        this.addCollectionText("New Table");
        this.deleteCollectionText("Delete Table");
        this.deleteDatabaseText("Delete Keyspace");
        this.collectionTitle("Cassandra API");
        this.collectionTreeNodeAltText("Table");
        this.refreshTreeTitle("Refresh tables");
        this.tableDataClient = new CassandraAPIDataClient();
        break;
    }

    this.commandBarComponentAdapter = new CommandBarComponentAdapter(this);

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

    this.isSparkEnabled = ko.observable(false);
    this.isSparkEnabled.subscribe((isEnabled: boolean) => this.refreshCommandBarButtons());
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
  }

  private onGitHubClientError = (error: any): void => {
    Logger.logError(getErrorMessage(error), "NotebookManager/onGitHubClientError");

    if (error.status === HttpStatusCodes.Unauthorized) {
      this.gitHubOAuthService.resetToken();

      this.showOkCancelModalDialog(
        undefined,
        "Cosmos DB cannot access your Github account anymore. Please connect to GitHub again.",
        "Connect to GitHub",
        () => this.openGitHubReposPanel("Connect to GitHub"),
        "Cancel",
        undefined
      );
    }
  };

  public openEnableSynapseLinkDialog(): void {
    const addSynapseLinkDialogProps: DialogProps = {
      linkProps: {
        linkText: "Learn more",
        linkUrl: "https://aka.ms/cosmosdb-synapselink",
      },
      isModal: true,
      visible: true,
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
        this._closeSynapseLinkModalDialog();

        const resourceProviderClient = new ResourceProviderClientFactory().getOrCreate(userContext.databaseAccount.id);

        try {
          const databaseAccount: DataModels.DatabaseAccount = await resourceProviderClient.patchAsync(
            userContext.databaseAccount.id,
            "2019-12-12",
            {
              properties: {
                enableAnalyticalStorage: true,
              },
            }
          );
          clearInProgressMessage();
          logConsoleInfo("Enabled Azure Synapse Link for this account");
          TelemetryProcessor.traceSuccess(Action.EnableAzureSynapseLink, {}, startTime);
          updateUserContext({ databaseAccount });
        } catch (error) {
          clearInProgressMessage();
          logConsoleError(`Enabling Azure Synapse Link for this account failed. ${getErrorMessage(error)}`);
          TelemetryProcessor.traceFailure(Action.EnableAzureSynapseLink, {}, startTime);
        } finally {
          this.isSynapseLinkUpdating(false);
        }
      },

      onSecondaryButtonClick: () => {
        this._closeSynapseLinkModalDialog();
        TelemetryProcessor.traceCancel(Action.EnableAzureSynapseLink);
      },
    };
    this.openDialog(addSynapseLinkDialogProps);
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

  public logConsoleData(consoleData: ConsoleData): void {
    this.setNotificationConsoleData(consoleData);
  }

  public deleteInProgressConsoleDataWithId(id: string): void {
    this.setInProgressConsoleDataIdToBeDeleted(id);
  }

  public expandConsole(): void {
    this.setIsNotificationConsoleExpanded(true);
  }

  public collapseConsole(): void {
    this.setIsNotificationConsoleExpanded(false);
  }

  public refreshDatabaseForResourceToken(): Q.Promise<any> {
    const databaseId = this.resourceTokenDatabaseId();
    const collectionId = this.resourceTokenCollectionId();
    if (!databaseId || !collectionId) {
      return Q.reject();
    }

    const deferred: Q.Deferred<void> = Q.defer();
    readCollection(databaseId, collectionId).then((collection: DataModels.Collection) => {
      this.resourceTokenCollection(new ResourceTokenCollection(this, databaseId, collection));
      this.selectedNode(this.resourceTokenCollection());
      deferred.resolve();
    });

    return deferred.promise;
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

  public async getArcadiaToken(): Promise<string> {
    return new Promise<string>((resolve: (token: string) => void, reject: (error: any) => void) => {
      sendCachedDataMessage<string>(MessageTypes.GetArcadiaToken, undefined /** params **/).then(
        (token: string) => {
          resolve(token);
        },
        (error: any) => {
          Logger.logError(getErrorMessage(error), "Explorer/getArcadiaToken");
          resolve(undefined);
        }
      );
    });
  }

  private async _getArcadiaWorkspaces(): Promise<ArcadiaWorkspaceItem[]> {
    try {
      const workspaces = await this._arcadiaManager.listWorkspacesAsync([userContext.subscriptionId]);
      let workspaceItems: ArcadiaWorkspaceItem[] = new Array(workspaces.length);
      const sparkPromises: Promise<void>[] = [];
      workspaces.forEach((workspace, i) => {
        let promise = this._arcadiaManager.listSparkPoolsAsync(workspaces[i].id).then(
          (sparkpools) => {
            workspaceItems[i] = { ...workspace, sparkPools: sparkpools };
          },
          (error) => {
            Logger.logError(getErrorMessage(error), "Explorer/this._arcadiaManager.listSparkPoolsAsync");
          }
        );
        sparkPromises.push(promise);
      });

      return Promise.all(sparkPromises).then(() => workspaceItems);
    } catch (error) {
      handleError(error, "Explorer/this._arcadiaManager.listWorkspacesAsync", "Get Arcadia workspaces failed");
      return Promise.resolve([]);
    }
  }

  public async createWorkspace(): Promise<string> {
    return sendCachedDataMessage(MessageTypes.CreateWorkspace, undefined /** params **/);
  }

  public async createSparkPool(workspaceId: string): Promise<string> {
    return sendCachedDataMessage(MessageTypes.CreateSparkPool, [workspaceId]);
  }

  public async initNotebooks(databaseAccount: DataModels.DatabaseAccount): Promise<void> {
    if (!databaseAccount) {
      throw new Error("No database account specified");
    }

    if (this._isInitializingNotebooks) {
      return;
    }
    this._isInitializingNotebooks = true;

    await this.ensureNotebookWorkspaceRunning();
    let connectionInfo: DataModels.NotebookWorkspaceConnectionInfo = {
      authToken: undefined,
      notebookServerEndpoint: undefined,
    };
    try {
      connectionInfo = await this.notebookWorkspaceManager.getNotebookConnectionInfoAsync(
        databaseAccount.id,
        "default"
      );
    } catch (error) {
      this._isInitializingNotebooks = false;
      handleError(
        error,
        "initNotebooks/getNotebookConnectionInfoAsync",
        `Failed to get notebook workspace connection info: ${getErrorMessage(error)}`
      );
      throw error;
    } finally {
      // Overwrite with feature flags
      if (userContext.features.notebookServerUrl) {
        connectionInfo.notebookServerEndpoint = userContext.features.notebookServerUrl;
      }

      if (userContext.features.notebookServerToken) {
        connectionInfo.authToken = userContext.features.notebookServerToken;
      }

      this.notebookServerInfo(connectionInfo);
      this.notebookServerInfo.valueHasMutated();
      this.refreshNotebookList();
    }

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
      visible: true,
      title: "Reset Workspace",
      subText: "This lets you keep your notebook files and the workspace will be restored to default. Proceed anyway?",
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
      onPrimaryButtonClick: this._resetNotebookWorkspace,
      onSecondaryButtonClick: this._closeModalDialog,
    };
    this.openDialog(resetConfirmationDialogProps);
  }

  private async _containsDefaultNotebookWorkspace(databaseAccount: DataModels.DatabaseAccount): Promise<boolean> {
    if (!databaseAccount) {
      return false;
    }

    try {
      const workspaces = await this.notebookWorkspaceManager.getNotebookWorkspacesAsync(databaseAccount?.id);
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
      const notebookWorkspace = await this.notebookWorkspaceManager.getNotebookWorkspaceAsync(
        userContext.databaseAccount.id,
        "default"
      );
      if (
        notebookWorkspace &&
        notebookWorkspace.properties &&
        notebookWorkspace.properties.status &&
        notebookWorkspace.properties.status.toLowerCase() === "stopped"
      ) {
        clearMessage = NotificationConsoleUtils.logConsoleProgress("Initializing notebook workspace");
        await this.notebookWorkspaceManager.startNotebookWorkspaceAsync(userContext.databaseAccount.id, "default");
      }
    } catch (error) {
      handleError(error, "Explorer/ensureNotebookWorkspaceRunning", "Failed to initialize notebook workspace");
    } finally {
      clearMessage && clearMessage();
    }
  }

  private _resetNotebookWorkspace = async () => {
    this._closeModalDialog();
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

  private _closeModalDialog = () => {
    this.closeDialog();
  };

  private _closeSynapseLinkModalDialog = () => {
    this.closeDialog();
  };

  public findSelectedDatabase(): ViewModels.Database {
    if (!this.selectedNode()) {
      return null;
    }
    if (this.selectedNode().nodeKind === "Database") {
      return _.find(this.databases(), (database: ViewModels.Database) => database.id() === this.selectedNode().id());
    }
    return this.findSelectedCollection().database;
  }

  public findDatabaseWithId(databaseId: string): ViewModels.Database {
    return _.find(this.databases(), (database: ViewModels.Database) => database.id() === databaseId);
  }

  public isLastNonEmptyDatabase(): boolean {
    if (
      this.isLastDatabase() &&
      this.databases()[0] &&
      this.databases()[0].collections &&
      this.databases()[0].collections().length > 0
    ) {
      return true;
    }
    return false;
  }

  public isLastDatabase(): boolean {
    if (this.databases().length > 1) {
      return false;
    }
    return true;
  }

  public isSelectedDatabaseShared(): boolean {
    const database = this.findSelectedDatabase();
    if (!!database) {
      return database.offer && !!database.offer();
    }

    return false;
  }

  public configure(inputs: ViewModels.DataExplorerInputsFrame): void {
    if (inputs != null) {
      // In development mode, save the iframe message from the portal in session storage.
      // This allows webpack hot reload to funciton properly
      if (process.env.NODE_ENV === "development") {
        sessionStorage.setItem("portalDataExplorerInitMessage", JSON.stringify(inputs));
      }
      if (inputs.defaultCollectionThroughput) {
        this.collectionCreationDefaults = inputs.defaultCollectionThroughput;
      }
      this.setFeatureFlagsFromFlights(inputs.flights);
      this.isAccountReady(true);
    }
  }

  public setFeatureFlagsFromFlights(flights: readonly string[]): void {
    if (!flights) {
      return;
    }
    if (flights.indexOf(Constants.Flights.AutoscaleTest) !== -1) {
      this.isAutoscaleDefaultEnabled(true);
    }
    if (flights.indexOf(Constants.Flights.MongoIndexing) !== -1) {
      this.isMongoIndexingEnabled(true);
    }
    if (flights.indexOf(Constants.Flights.SchemaAnalyzer) !== -1) {
      userContext.features.enableSchemaAnalyzer = true;
    }
  }

  public findSelectedCollection(): ViewModels.Collection {
    return (this.selectedNode().nodeKind === "Collection"
      ? this.selectedNode()
      : this.selectedNode().collection) as ViewModels.Collection;
  }

  public isRunningOnNationalCloud(): boolean {
    return (
      userContext.portalEnv === "blackforest" ||
      userContext.portalEnv === "fairfax" ||
      userContext.portalEnv === "mooncake"
    );
  }

  public onUpdateTabsButtons(buttons: CommandButtonComponentProps[]): void {
    this.commandBarComponentAdapter.onUpdateTabsButtons(buttons);
  }

  private refreshAndExpandNewDatabases(newDatabases: ViewModels.Database[]): Q.Promise<void> {
    // we reload collections for all databases so the resource tree reflects any collection-level changes
    // i.e addition of stored procedures, etc.
    const deferred: Q.Deferred<void> = Q.defer<void>();
    let loadCollectionPromises: Q.Promise<void>[] = [];

    // If the user has a lot of databases, only load expanded databases.
    const databasesToLoad =
      this.databases().length <= Explorer.MaxNbDatabasesToAutoExpand
        ? this.databases()
        : this.databases().filter((db) => db.isDatabaseExpanded());

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

  public findCollection(databaseId: string, collectionId: string): ViewModels.Collection {
    const database: ViewModels.Database = this.databases().find(
      (database: ViewModels.Database) => database.id() === databaseId
    );
    return database?.collections().find((collection: ViewModels.Collection) => collection.id() === collectionId);
  }

  public isLastCollection(): boolean {
    let collectionCount = 0;
    if (this.databases().length == 0) {
      return false;
    }
    for (let i = 0; i < this.databases().length; i++) {
      const database = this.databases()[i];
      collectionCount += database.collections().length;
      if (collectionCount > 1) {
        return false;
      }
    }
    return true;
  }

  private getDeltaDatabases(
    updatedDatabaseList: DataModels.Database[]
  ): { toAdd: ViewModels.Database[]; toDelete: ViewModels.Database[] } {
    const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
      const databaseExists = _.some(
        this.databases(),
        (existingDatabase: ViewModels.Database) => existingDatabase.id() === database.id
      );
      return !databaseExists;
    });
    const databasesToAdd: ViewModels.Database[] = newDatabases.map(
      (newDatabase: DataModels.Database) => new Database(this, newDatabase)
    );

    let databasesToDelete: ViewModels.Database[] = [];
    ko.utils.arrayForEach(this.databases(), (database: ViewModels.Database) => {
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
    this.databases(
      this.databases()
        .concat(databases)
        .sort((database1, database2) => database1.id().localeCompare(database2.id()))
    );
  }

  private deleteDatabasesFromList(databasesToRemove: ViewModels.Database[]): void {
    const databasesToKeep: ViewModels.Database[] = [];

    ko.utils.arrayForEach(this.databases(), (database: ViewModels.Database) => {
      const shouldRemoveDatabase = _.some(databasesToRemove, (db: ViewModels.Database) => db.id === database.id);
      if (!shouldRemoveDatabase) {
        databasesToKeep.push(database);
      }
    });

    this.databases(databasesToKeep);
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
      this.isPublishNotebookPaneEnabled(true);
    }
  }

  public copyNotebook(name: string, content: string): void {
    this.notebookManager?.openCopyNotebookPane(name, content);
  }

  public showOkModalDialog(title: string, msg: string): void {
    this.openDialog({
      isModal: true,
      visible: true,
      title,
      subText: msg,
      primaryButtonText: "Close",
      secondaryButtonText: undefined,
      onPrimaryButtonClick: this._closeModalDialog,
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
    this.openDialog({
      isModal: true,
      visible: true,
      title,
      subText: msg,
      primaryButtonText: okLabel,
      secondaryButtonText: cancelLabel,
      onPrimaryButtonClick: () => {
        this._closeModalDialog();
        onOk && onOk();
      },
      onSecondaryButtonClick: () => {
        this._closeModalDialog();
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
        hashLocation: "notebooks",
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null,
        onUpdateTabsButtons: this.onUpdateTabsButtons,
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
      this.openSidePanel(
        "",
        <StringInputPane
          explorer={this}
          closePanel={() => {
            this.closeSidePanel();
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

    this.openSidePanel(
      "",
      <StringInputPane
        explorer={this}
        closePanel={() => {
          this.closeSidePanel();
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

  public _refreshSparkEnabledStateForAccount = async (): Promise<void> => {
    const { subscriptionId, authType } = userContext;
    const armEndpoint = configContext.ARM_ENDPOINT;
    if (!subscriptionId || !armEndpoint || authType === AuthType.EncryptedToken) {
      // explorer is not aware of the database account yet
      this.isSparkEnabledForAccount(false);
      return;
    }

    const featureUri = `subscriptions/${subscriptionId}/providers/Microsoft.Features/providers/Microsoft.DocumentDb/features/${Constants.AfecFeatures.Spark}`;
    const resourceProviderClient = new ResourceProviderClientFactory().getOrCreate(featureUri);
    try {
      const sparkNotebooksFeature: DataModels.AfecFeature = await resourceProviderClient.getAsync(
        featureUri,
        Constants.ArmApiVersions.armFeatures
      );
      const isEnabled =
        (sparkNotebooksFeature &&
          sparkNotebooksFeature.properties &&
          sparkNotebooksFeature.properties.state === "Registered") ||
        false;
      this.isSparkEnabledForAccount(isEnabled);
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/isSparkEnabledForAccount");
      this.isSparkEnabledForAccount(false);
    }
  };

  public _isAfecFeatureRegistered = async (featureName: string): Promise<boolean> => {
    const { subscriptionId, authType } = userContext;
    const armEndpoint = configContext.ARM_ENDPOINT;
    if (!featureName || !subscriptionId || !armEndpoint || authType === AuthType.EncryptedToken) {
      // explorer is not aware of the database account yet
      return false;
    }

    const featureUri = `subscriptions/${subscriptionId}/providers/Microsoft.Features/providers/Microsoft.DocumentDb/features/${featureName}`;
    const resourceProviderClient = new ResourceProviderClientFactory().getOrCreate(featureUri);
    try {
      const featureStatus: DataModels.AfecFeature = await resourceProviderClient.getAsync(
        featureUri,
        Constants.ArmApiVersions.armFeatures
      );
      const isEnabled =
        (featureStatus && featureStatus.properties && featureStatus.properties.state === "Registered") || false;
      return isEnabled;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/isSparkEnabledForAccount");
      return false;
    }
  };
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
      this.openDialog({
        isModal: true,
        visible: true,
        title: "Unable to delete file",
        subText: "Directory is not empty.",
        primaryButtonText: "Close",
        secondaryButtonText: undefined,
        onPrimaryButtonClick: this._closeModalDialog,
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
    let hashLocation: string;

    switch (kind) {
      case ViewModels.TerminalKind.Default:
        title = "Terminal";
        hashLocation = "terminal";
        break;

      case ViewModels.TerminalKind.Mongo:
        title = "Mongo Shell";
        hashLocation = "mongo-shell";
        break;

      case ViewModels.TerminalKind.Cassandra:
        title = "Cassandra Shell";
        hashLocation = "cassandra-shell";
        break;

      default:
        throw new Error("Terminal kind: ${kind} not supported");
    }

    const terminalTabs: TerminalTab[] = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Terminal,
      (tab) => tab.hashLocation() == hashLocation
    ) as TerminalTab[];
    let terminalTab: TerminalTab = terminalTabs && terminalTabs[0];

    if (terminalTab) {
      this.tabsManager.activateTab(terminalTab);
    } else {
      const newTab = new TerminalTab({
        account: userContext.databaseAccount,
        tabKind: ViewModels.CollectionTabKind.Terminal,
        node: null,
        title: title,
        tabPath: title,
        collection: null,
        hashLocation: hashLocation,
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null,
        onUpdateTabsButtons: this.onUpdateTabsButtons,
        container: this,
        kind: kind,
      });

      this.tabsManager.activateNewTab(newTab);
    }
  }

  public async openGallery(
    selectedTab?: GalleryTabKind,
    notebookUrl?: string,
    galleryItem?: IGalleryItem,
    isFavorite?: boolean
  ) {
    const title = "Gallery";
    const hashLocation = "gallery";
    const GalleryTab = await (await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab")).default;
    const galleryTab = this.tabsManager
      .getTabs(ViewModels.CollectionTabKind.Gallery)
      .find((tab) => tab.hashLocation() == hashLocation);

    if (galleryTab instanceof GalleryTab) {
      this.tabsManager.activateTab(galleryTab);
    } else {
      this.tabsManager.activateNewTab(
        new GalleryTab(
          {
            tabKind: ViewModels.CollectionTabKind.Gallery,
            title: title,
            tabPath: title,
            hashLocation: hashLocation,
            onUpdateTabsButtons: this.onUpdateTabsButtons,
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
      this.cassandraAddCollectionPane.open();
    } else {
      this.openAddCollectionPanel(databaseId);
    }
  }

  private refreshCommandBarButtons(): void {
    const activeTab = this.tabsManager.activeTab();
    if (activeTab) {
      activeTab.onActivate(); // TODO only update tabs buttons?
    } else {
      this.onUpdateTabsButtons([]);
    }
  }

  private getTokenRefreshInterval(token: string): number {
    let tokenRefreshInterval = Constants.ClientDefaults.arcadiaTokenRefreshInterval;
    if (!token) {
      return tokenRefreshInterval;
    }

    try {
      const tokenPayload = decryptJWTToken(this.arcadiaToken());
      if (tokenPayload && tokenPayload.hasOwnProperty("exp")) {
        const expirationTime = tokenPayload.exp as number; // seconds since unix epoch
        const now = new Date().getTime() / 1000;
        const tokenExpirationIntervalInMs = (expirationTime - now) * 1000;
        if (tokenExpirationIntervalInMs < tokenRefreshInterval) {
          tokenRefreshInterval =
            tokenExpirationIntervalInMs - Constants.ClientDefaults.arcadiaTokenRefreshIntervalPaddingMs;
        }
      }
      return tokenRefreshInterval;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "Explorer/getTokenRefreshInterval");
      return tokenRefreshInterval;
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

  public async loadSelectedDatabaseOffer(): Promise<void> {
    const database = this.findSelectedDatabase();
    await database?.loadOffer();
  }

  public async loadDatabaseOffers(): Promise<void> {
    await Promise.all(
      this.databases()?.map(async (database: ViewModels.Database) => {
        await database.loadOffer();
      })
    );
  }

  public isFirstResourceCreated(): boolean {
    const databases: ViewModels.Database[] = this.databases();

    if (!databases || databases.length === 0) {
      return false;
    }

    return databases.some((database) => {
      // user has created at least one collection
      if (database.collections()?.length > 0) {
        return true;
      }
      // user has created a database with shared throughput
      if (database.offer()) {
        return true;
      }
      // use has created an empty database without shared throughput
      return false;
    });
  }

  public openDeleteCollectionConfirmationPane(): void {
    this.openSidePanel(
      "Delete " + getCollectionName(),
      <DeleteCollectionConfirmationPane explorer={this} closePanel={this.closeSidePanel} />
    );
  }

  public openDeleteDatabaseConfirmationPane(): void {
    this.openSidePanel(
      "Delete " + getDatabaseName(),
      <DeleteDatabaseConfirmationPanel
        explorer={this}
        openNotificationConsole={this.expandConsole}
        closePanel={this.closeSidePanel}
        selectedDatabase={this.findSelectedDatabase()}
      />
    );
  }

  public openUploadItemsPanePane(): void {
    this.openSidePanel("Upload " + getUploadName(), <UploadItemsPane explorer={this} />);
  }

  public openSettingPane(): void {
    this.openSidePanel(
      "Setting",
      <SettingsPane expandConsole={() => this.expandConsole()} closePanel={this.closeSidePanel} />
    );
  }

  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    this.openSidePanel(
      "Input parameters",
      <ExecuteSprocParamsPane
        storedProcedure={storedProcedure}
        expandConsole={() => this.expandConsole()}
        closePanel={() => this.closeSidePanel()}
      />
    );
  }

  public async openAddCollectionPanel(databaseId?: string): Promise<void> {
    await this.loadDatabaseOffers();
    this.openSidePanel(
      "New " + getCollectionName(),
      <AddCollectionPanel
        explorer={this}
        closePanel={() => this.closeSidePanel()}
        openNotificationConsole={() => this.expandConsole()}
        databaseId={databaseId}
      />
    );
  }
  public openAddDatabasePane(): void {
    this.openSidePanel(
      "New " + getDatabaseName(),
      <AddDatabasePanel
        explorer={this}
        openNotificationConsole={() => this.expandConsole()}
        closePanel={this.closeSidePanel}
      />
    );
  }

  public openBrowseQueriesPanel(): void {
    this.openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={this} closePanel={this.closeSidePanel} />);
  }

  public openLoadQueryPanel(): void {
    this.openSidePanel("Load Query", <LoadQueryPane explorer={this} closePanel={() => this.closeSidePanel()} />);
  }

  public openSaveQueryPanel(): void {
    this.openSidePanel("Save Query", <SaveQueryPane explorer={this} closePanel={() => this.closeSidePanel()} />);
  }

  public openUploadFilePanel(parent?: NotebookContentItem): void {
    parent = parent || this.resourceTree.myNotebooksContentRoot;
    this.openSidePanel(
      "Upload file to notebook server",
      <UploadFilePane
        expandConsole={() => this.expandConsole()}
        closePanel={this.closeSidePanel}
        uploadFile={(name: string, content: string) => this.uploadFile(name, content, parent)}
      />
    );
  }

  public openGitHubReposPanel(header: string, junoClient?: JunoClient): void {
    this.openSidePanel(
      header,
      <GitHubReposPanel
        explorer={this}
        closePanel={this.closeSidePanel}
        gitHubClientProp={this.notebookManager.gitHubClient}
        junoClientProp={junoClient}
        openNotificationConsole={() => this.expandConsole()}
      />
    );
  }

  public openAddTableEntityPanel(queryTablesTab: QueryTablesTab, tableEntityListViewModel: TableListViewModal): void {
    this.openSidePanel(
      "Add Table Entity",
      <AddTableEntityPanel
        explorer={this}
        closePanel={this.closeSidePanel}
        queryTablesTab={queryTablesTab}
        tableEntityListViewModel={tableEntityListViewModel}
        cassandraApiClient={new CassandraAPIDataClient()}
      />
    );
  }
  public openSetupNotebooksPanel(title: string, description: string): void {
    this.openSidePanel(
      title,
      <SetupNoteBooksPanel
        explorer={this}
        closePanel={this.closeSidePanel}
        openNotificationConsole={() => this.expandConsole()}
        panelTitle={title}
        panelDescription={description}
      />
    );
  }

  public openEditTableEntityPanel(queryTablesTab: QueryTablesTab, tableEntityListViewModel: TableListViewModal): void {
    this.openSidePanel(
      "Edit Table Entity",
      <EditTableEntityPanel
        explorer={this}
        closePanel={this.closeSidePanel}
        queryTablesTab={queryTablesTab}
        tableEntityListViewModel={tableEntityListViewModel}
        cassandraApiClient={new CassandraAPIDataClient()}
      />
    );
  }

  public openTableSelectQueryPanel(queryViewModal: QueryViewModel): void {
    this.openSidePanel(
      "Select Column",
      <TableQuerySelectPanel explorer={this} closePanel={this.closeSidePanel} queryViewModel={queryViewModal} />
    );
  }
}
