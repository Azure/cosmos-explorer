import * as ComponentRegisterer from "./ComponentRegisterer";
import * as Constants from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";
import * as ko from "knockout";
import * as MostRecentActivity from "./MostRecentActivity/MostRecentActivity";
import * as path from "path";
import * as SharedConstants from "../Shared/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import _ from "underscore";
import AddCollectionPane from "./Panes/AddCollectionPane";
import AddDatabasePane from "./Panes/AddDatabasePane";
import AddTableEntityPane from "./Panes/Tables/AddTableEntityPane";
import AuthHeadersUtil from "../Platform/Hosted/Authorization";
import CassandraAddCollectionPane from "./Panes/CassandraAddCollectionPane";
import Database from "./Tree/Database";
import DeleteCollectionConfirmationPane from "./Panes/DeleteCollectionConfirmationPane";
import DeleteDatabaseConfirmationPane from "./Panes/DeleteDatabaseConfirmationPane";
import DocumentClientUtilityBase from "../Common/DocumentClientUtilityBase";
import EditTableEntityPane from "./Panes/Tables/EditTableEntityPane";
import EnvironmentUtility from "../Common/EnvironmentUtility";
import GraphStylingPane from "./Panes/GraphStylingPane";
import hasher from "hasher";
import NewVertexPane from "./Panes/NewVertexPane";
import NotebookTab from "./Tabs/NotebookTab";
import NotebookV2Tab from "./Tabs/NotebookV2Tab";
import Q from "q";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import SparkMasterTab from "./Tabs/SparkMasterTab";
import TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import TerminalTab from "./Tabs/TerminalTab";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { ActionContracts, MessageTypes } from "../Contracts/ExplorerContracts";
import { ArcadiaResourceManager } from "../SparkClusterManager/ArcadiaResourceManager";
import { ArcadiaWorkspaceItem } from "./Controls/Arcadia/ArcadiaMenuPicker";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import { BrowseQueriesPane } from "./Panes/BrowseQueriesPane";
import { CassandraApi } from "../Api/Apis";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import { ClusterLibraryPane } from "./Panes/ClusterLibraryPane";
import { CommandBarComponentAdapter } from "./Menus/CommandBar/CommandBarComponentAdapter";
import { config } from "../Config";
import { ConsoleData, ConsoleDataType } from "./Menus/NotificationConsole/NotificationConsoleComponent";
import { CosmosClient } from "../Common/CosmosClient";
import { decryptJWTToken, getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { DialogComponentAdapter } from "./Controls/DialogReactComponent/DialogComponentAdapter";
import { DialogProps, TextFieldProps } from "./Controls/DialogReactComponent/DialogComponent";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane";
import { ExplorerMetrics } from "../Common/Constants";
import { ExplorerSettings } from "../Shared/ExplorerSettings";
import { FileSystemUtil } from "./Notebook/FileSystemUtil";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { GitHubReposPane } from "./Panes/GitHubReposPane";
import { handleOpenAction } from "./OpenActions";
import { IContentProvider } from "@nteract/core";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";
import { JunoClient } from "../Juno/JunoClient";
import { LibraryManagePane } from "./Panes/LibraryManagePane";
import { LoadQueryPane } from "./Panes/LoadQueryPane";
import { Logger } from "../Common/Logger";
import { ManageSparkClusterPane } from "./Panes/ManageSparkClusterPane";
import { MessageHandler } from "../Common/MessageHandler";
import { NotebookContentItem, NotebookContentItemType } from "./Notebook/NotebookContentItem";
import { NotebookContentProvider } from "./Notebook/NotebookComponent/NotebookContentProvider";
import { NotebookUtil } from "./Notebook/NotebookUtil";
import { NotebookWorkspaceManager } from "../NotebookWorkspaceManager/NotebookWorkspaceManager";
import { NotificationConsoleComponentAdapter } from "./Menus/NotificationConsole/NotificationConsoleComponentAdapter";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { PlatformType } from "../PlatformType";
import { QueriesClient } from "../Common/QueriesClient";
import { QuerySelectPane } from "./Panes/Tables/QuerySelectPane";
import { RenewAdHocAccessPane } from "./Panes/RenewAdHocAccessPane";
import { ResourceProviderClientFactory } from "../ResourceProvider/ResourceProviderClientFactory";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import { ResourceTreeAdapterForResourceToken } from "./Tree/ResourceTreeAdapterForResourceToken";
import { RouteHandler } from "../RouteHandlers/RouteHandler";
import { SaveQueryPane } from "./Panes/SaveQueryPane";
import { SettingsPane } from "./Panes/SettingsPane";
import { SetupNotebooksPane } from "./Panes/SetupNotebooksPane";
import { SetupSparkClusterPane } from "./Panes/SetupSparkClusterPane";
import { SparkClusterManager } from "../SparkClusterManager/SparkClusterManager";
import { SplashScreenComponentAdapter } from "./SplashScreen/SplashScreenComponentApdapter";
import { Splitter, SplitterBounds, SplitterDirection } from "../Common/Splitter";
import { StringInputPane } from "./Panes/StringInputPane";
import { TableColumnOptionsPane } from "./Panes/Tables/TableColumnOptionsPane";
import { UploadFilePane } from "./Panes/UploadFilePane";
import { UploadItemsPane } from "./Panes/UploadItemsPane";

BindingHandlersRegisterer.registerBindingHandlers();
// Hold a reference to ComponentRegisterer to prevent transpiler to ignore import
var tmp = ComponentRegisterer;

enum ShareAccessToggleState {
  ReadWrite,
  Read
}

export default class Explorer implements ViewModels.Explorer {
  public flight: ko.Observable<string> = ko.observable<string>(
    SharedConstants.CollectionCreation.DefaultAddCollectionDefaultFlight
  );

  public addCollectionText: ko.Observable<string>;
  public addDatabaseText: ko.Observable<string>;
  public collectionTitle: ko.Observable<string>;
  public deleteCollectionText: ko.Observable<string>;
  public deleteDatabaseText: ko.Observable<string>;
  public collectionTreeNodeAltText: ko.Observable<string>;
  public refreshTreeTitle: ko.Observable<string>;
  public hasWriteAccess: ko.Observable<boolean>;
  public collapsedResourceTreeWidth: number = ExplorerMetrics.CollapsedResourceTreeWidth;

  public databaseAccount: ko.Observable<ViewModels.DatabaseAccount>;
  public collectionCreationDefaults: ViewModels.CollectionCreationDefaults = SharedConstants.CollectionCreationDefaults;
  public subscriptionType: ko.Observable<ViewModels.SubscriptionType>;
  public quotaId: ko.Observable<string>;
  public defaultExperience: ko.Observable<string>;
  public isPreferredApiDocumentDB: ko.Computed<boolean>;
  public isPreferredApiCassandra: ko.Computed<boolean>;
  public isPreferredApiMongoDB: ko.Computed<boolean>;
  public isPreferredApiGraph: ko.Computed<boolean>;
  public isPreferredApiTable: ko.Computed<boolean>;
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public isEmulator: boolean;
  public isAccountReady: ko.Observable<boolean>;
  public canSaveQueries: ko.Computed<boolean>;
  public features: ko.Observable<any>;
  public serverId: ko.Observable<string>;
  public extensionEndpoint: ko.Observable<string>;
  public armEndpoint: ko.Observable<string>;
  public isTryCosmosDBSubscription: ko.Observable<boolean>;
  public documentClientUtility: DocumentClientUtilityBase;
  public notificationsClient: ViewModels.NotificationsClient;
  public queriesClient: ViewModels.QueriesClient;
  public tableDataClient: TableDataClient;
  public splitter: Splitter;
  public parentFrameDataExplorerVersion: ko.Observable<string> = ko.observable<string>("");
  public mostRecentActivity: MostRecentActivity.MostRecentActivity;

  // Notification Console
  public notificationConsoleData: ko.ObservableArray<ConsoleData>;
  public isNotificationConsoleExpanded: ko.Observable<boolean>;

  // Panes
  public contextPanes: ViewModels.ContextualPane[];

  // Resource Tree
  public databases: ko.ObservableArray<ViewModels.Database>;
  public nonSystemDatabases: ko.Computed<ViewModels.Database[]>;
  public selectedDatabaseId: ko.Computed<string>;
  public selectedCollectionId: ko.Computed<string>;
  public isLeftPaneExpanded: ko.Observable<boolean>;
  public selectedNode: ko.Observable<ViewModels.TreeNode>;
  public isRefreshingExplorer: ko.Observable<boolean>;
  private resourceTree: ResourceTreeAdapter;
  private enableLegacyResourceTree: ko.Observable<boolean>;

  // Resource Token
  public resourceTokenDatabaseId: ko.Observable<string>;
  public resourceTokenCollectionId: ko.Observable<string>;
  public resourceTokenCollection: ko.Observable<ViewModels.CollectionBase>;
  public resourceTokenPartitionKey: ko.Observable<string>;
  public isAuthWithResourceToken: ko.Observable<boolean>;
  public isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;
  private resourceTreeForResourceToken: ResourceTreeAdapterForResourceToken;

  // Tabs
  public openedTabs: ko.ObservableArray<ViewModels.Tab>;
  public activeTab: ko.Observable<ViewModels.Tab>;
  public isTabsContentExpanded: ko.Observable<boolean>;
  public galleryTab: any;
  public notebookViewerTab: any;

  // Contextual panes
  public addDatabasePane: ViewModels.AddDatabasePane;
  public addCollectionPane: ViewModels.AddCollectionPane;
  public deleteCollectionConfirmationPane: ViewModels.DeleteCollectionConfirmationPane;
  public deleteDatabaseConfirmationPane: ViewModels.DeleteDatabaseConfirmationPane;
  public graphStylingPane: ViewModels.GraphStylingPane;
  public addTableEntityPane: ViewModels.AddTableEntityPane;
  public editTableEntityPane: ViewModels.EditTableEntityPane;
  public tableColumnOptionsPane: TableColumnOptionsPane;
  public querySelectPane: QuerySelectPane;
  public newVertexPane: ViewModels.NewVertexPane;
  public cassandraAddCollectionPane: ViewModels.CassandraAddCollectionPane;
  public settingsPane: ViewModels.SettingsPane;
  public executeSprocParamsPane: ViewModels.ExecuteSprocParamsPane;
  public renewAdHocAccessPane: ViewModels.RenewAdHocAccessPane;
  public uploadItemsPane: ViewModels.UploadItemsPane;
  public loadQueryPane: ViewModels.LoadQueryPane;
  public saveQueryPane: ViewModels.ContextualPane;
  public browseQueriesPane: ViewModels.BrowseQueriesPane;
  public uploadFilePane: UploadFilePane;
  public stringInputPane: StringInputPane;
  public setupNotebooksPane: SetupNotebooksPane;
  public setupSparkClusterPane: ViewModels.ContextualPane;
  public manageSparkClusterPane: ViewModels.ContextualPane;
  public libraryManagePane: ViewModels.ContextualPane;
  public clusterLibraryPane: ViewModels.ContextualPane;
  public gitHubReposPane: ViewModels.ContextualPane;

  // features
  public isGalleryEnabled: ko.Computed<boolean>;
  public isGitHubPaneEnabled: ko.Observable<boolean>;
  public isGraphsEnabled: ko.Computed<boolean>;
  public isHostedDataExplorerEnabled: ko.Computed<boolean>;
  public canExceedMaximumValue: ko.Computed<boolean>;
  public hasAutoPilotV2FeatureFlag: ko.Computed<boolean>;

  public shouldShowShareDialogContents: ko.Observable<boolean>;
  public shareAccessData: ko.Observable<ViewModels.AdHocAccessData>;
  public renewExplorerShareAccess: (explorer: ViewModels.Explorer, token: string) => Q.Promise<void>;
  public renewTokenError: ko.Observable<string>;
  public tokenForRenewal: ko.Observable<string>;
  public shareAccessToggleState: ko.Observable<ShareAccessToggleState>;
  public shareAccessUrl: ko.Observable<string>;
  public shareUrlCopyHelperText: ko.Observable<string>;
  public shareTokenCopyHelperText: ko.Observable<string>;
  public shouldShowDataAccessExpiryDialog: ko.Observable<boolean>;
  public shouldShowContextSwitchPrompt: ko.Observable<boolean>;

  // Notebooks
  public isNotebookEnabled: ko.Observable<boolean>;
  public isNotebooksEnabledForAccount: ko.Observable<boolean>;
  private notebookClient: ViewModels.INotebookContainerClient;
  private notebookContentClient: ViewModels.INotebookContentClient;
  public notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>;
  public notebookContentProvider: IContentProvider;
  public gitHubOAuthService: GitHubOAuthService;
  public notebookWorkspaceManager: ViewModels.NotebookWorkspaceManager;
  public sparkClusterManager: ViewModels.SparkClusterManager;
  public sparkClusterConnectionInfo: ko.Observable<DataModels.SparkClusterConnectionInfo>;
  public isSparkEnabled: ko.Observable<boolean>;
  public isSparkEnabledForAccount: ko.Observable<boolean>;
  public arcadiaToken: ko.Observable<string>;
  public arcadiaWorkspaces: ko.ObservableArray<ArcadiaWorkspaceItem>;
  public hasStorageAnalyticsAfecFeature: ko.Observable<boolean>;
  public isSynapseLinkUpdating: ko.Observable<boolean>;
  public isNotebookTabActive: ko.Computed<boolean>;
  public memoryUsageInfo: ko.Observable<DataModels.MemoryUsageInfo>;

  private _panes: ViewModels.ContextualPane[] = [];
  private _importExplorerConfigComplete: boolean = false;
  private _isSystemDatabasePredicate: (database: ViewModels.Database) => boolean = database => false;
  private _isInitializingNotebooks: boolean;
  private _isInitializingSparkConnectionInfo: boolean;
  private notebookBasePath: ko.Observable<string>;
  private _arcadiaManager: ViewModels.ArcadiaResourceManager;
  private _filePathToImportAndOpen: string;

  // React adapters
  private commandBarComponentAdapter: CommandBarComponentAdapter;
  private splashScreenAdapter: SplashScreenComponentAdapter;
  private notificationConsoleComponentAdapter: NotificationConsoleComponentAdapter;
  private dialogComponentAdapter: DialogComponentAdapter;
  private _dialogProps: ko.Observable<DialogProps>;
  private addSynapseLinkDialog: DialogComponentAdapter;
  private _addSynapseLinkDialogProps: ko.Observable<DialogProps>;

  private static readonly MaxNbDatabasesToAutoExpand = 5;

  constructor(options: ViewModels.ExplorerOptions) {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree
    });
    this.addCollectionText = ko.observable<string>("New Collection");
    this.addDatabaseText = ko.observable<string>("New Database");
    this.hasWriteAccess = ko.observable<boolean>(true);
    this.collectionTitle = ko.observable<string>("Collections");
    this.collectionTreeNodeAltText = ko.observable<string>("Collection");
    this.deleteCollectionText = ko.observable<string>("Delete Collection");
    this.deleteDatabaseText = ko.observable<string>("Delete Database");
    this.refreshTreeTitle = ko.observable<string>("Refresh collections");

    this.databaseAccount = ko.observable<ViewModels.DatabaseAccount>();
    this.subscriptionType = ko.observable<ViewModels.SubscriptionType>(
      SharedConstants.CollectionCreation.DefaultSubscriptionType
    );
    this.quotaId = ko.observable<string>("");
    let firstInitialization = true;
    this.isRefreshingExplorer = ko.observable<boolean>(true);
    this.isRefreshingExplorer.subscribe((isRefreshing: boolean) => {
      if (!isRefreshing && firstInitialization) {
        // set focus on first element
        firstInitialization = false;
        try {
          document.getElementById("createNewContainerCommandButton").parentElement.parentElement.focus();
        } catch (e) {
          Logger.logWarning(
            "getElementById('createNewContainerCommandButton') failed to find element",
            "Explorer/this.isRefreshingExplorer.subscribe"
          );
        }
      }
    });
    this.isAccountReady = ko.observable<boolean>(false);
    this._isInitializingNotebooks = false;
    this._isInitializingSparkConnectionInfo = false;
    this.arcadiaToken = ko.observable<string>();
    this.arcadiaToken.subscribe((token: string) => {
      if (token) {
        this.openedTabs &&
          this.openedTabs().forEach(tab => {
            if (tab.tabKind === ViewModels.CollectionTabKind.Notebook) {
              (tab as NotebookTab).reconfigureServiceEndpoints();
            } else if (tab.tabKind === ViewModels.CollectionTabKind.NotebookV2) {
              (tab as NotebookV2Tab).reconfigureServiceEndpoints();
            }
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
        this.isAuthWithResourceToken() ? this.refreshDatabaseForResourceToken() : this.refreshAllDatabases(true);
        RouteHandler.getInstance().initHandler();
        this.notebookWorkspaceManager = new NotebookWorkspaceManager(this.armEndpoint());
        this.sparkClusterManager = new SparkClusterManager(this.armEndpoint());
        this.arcadiaWorkspaces = ko.observableArray();
        this._arcadiaManager = new ArcadiaResourceManager(this.armEndpoint());
        this._isAfecFeatureRegistered(Constants.AfecFeatures.StorageAnalytics).then(isRegistered =>
          this.hasStorageAnalyticsAfecFeature(isRegistered)
        );
        Promise.all([this._refreshNotebooksEnabledStateForAccount(), this._refreshSparkEnabledStateForAccount()]).then(
          async () => {
            this.isNotebookEnabled(
              !this.isAuthWithResourceToken() &&
                ((await this._containsDefaultNotebookWorkspace(this.databaseAccount())) ||
                  this.isFeatureEnabled(Constants.Features.enableNotebooks))
            );

            TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
              isNotebookEnabled: this.isNotebookEnabled(),
              databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
              defaultExperience: this.defaultExperience && this.defaultExperience(),
              dataExplorerArea: Constants.Areas.Notebook
            });

            if (this.isNotebookEnabled()) {
              await this.initNotebooks(this.databaseAccount());
              const workspaces = await this._getArcadiaWorkspaces();
              this.arcadiaWorkspaces(workspaces);
            } else if (this._filePathToImportAndOpen) {
              // if notebooks is not enabled but the user is trying to do a quickstart setup with notebooks, open the SetupNotebooksPane
              this._openSetupNotebooksPaneForQuickstart();
            }

            this.isSparkEnabled(
              (this.isNotebookEnabled() &&
                this.isSparkEnabledForAccount() &&
                this.arcadiaWorkspaces() &&
                this.arcadiaWorkspaces().length > 0) ||
                this.isFeatureEnabled(Constants.Features.enableSpark)
            );
            if (this.isSparkEnabled()) {
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
    this.documentClientUtility = options.documentClientUtility;
    this.notificationsClient = options.notificationsClient;
    this.isEmulator = options.isEmulator;

    this.features = ko.observable();
    this.serverId = ko.observable<string>();
    this.extensionEndpoint = ko.observable<string>(undefined);
    this.armEndpoint = ko.observable<string>(undefined);
    this.queriesClient = new QueriesClient(this);
    this.isTryCosmosDBSubscription = ko.observable<boolean>(false);
    this.enableLegacyResourceTree = ko.observable<boolean>(false);

    this.resourceTokenDatabaseId = ko.observable<string>();
    this.resourceTokenCollectionId = ko.observable<string>();
    this.resourceTokenCollection = ko.observable<ViewModels.CollectionBase>();
    this.resourceTokenPartitionKey = ko.observable<string>();
    this.isAuthWithResourceToken = ko.observable<boolean>(false);

    this.shareAccessData = ko.observable<ViewModels.AdHocAccessData>({
      readWriteUrl: undefined,
      readUrl: undefined
    });
    this.tokenForRenewal = ko.observable<string>("");
    this.renewTokenError = ko.observable<string>("");
    this.shareAccessUrl = ko.observable<string>();
    this.shareUrlCopyHelperText = ko.observable<string>("Click to copy");
    this.shareTokenCopyHelperText = ko.observable<string>("Click to copy");
    this.shareAccessToggleState = ko.observable<ShareAccessToggleState>(ShareAccessToggleState.ReadWrite);
    this.shareAccessToggleState.subscribe((toggleState: ShareAccessToggleState) => {
      if (toggleState === ShareAccessToggleState.ReadWrite) {
        this.shareAccessUrl(this.shareAccessData && this.shareAccessData().readWriteUrl);
      } else {
        this.shareAccessUrl(this.shareAccessData && this.shareAccessData().readUrl);
      }
    });
    this.shouldShowShareDialogContents = ko.observable<boolean>(false);
    this.shouldShowDataAccessExpiryDialog = ko.observable<boolean>(false);
    this.shouldShowContextSwitchPrompt = ko.observable<boolean>(false);
    this.isGalleryEnabled = ko.computed<boolean>(() => this.isFeatureEnabled(Constants.Features.enableGallery));
    this.isGitHubPaneEnabled = ko.observable<boolean>(false);
    this.isGraphsEnabled = ko.computed<boolean>(() => {
      return this.isFeatureEnabled(Constants.Features.graphs);
    });

    this.canExceedMaximumValue = ko.computed<boolean>(() =>
      this.isFeatureEnabled(Constants.Features.canExceedMaximumValue)
    );

    this.hasAutoPilotV2FeatureFlag = ko.computed(() => {
      if (this.isFeatureEnabled(Constants.Features.enableAutoPilotV2)) {
        return true;
      }
      return false;
    });

    this.isNotificationConsoleExpanded = ko.observable<boolean>(false);

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
    this.isLeftPaneExpanded = ko.observable<boolean>(true);
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
      max: ExplorerMetrics.SplitterMaxWidth
    };
    this.splitter = new Splitter({
      splitterId: "h_splitter1",
      leftId: "resourcetree",
      bounds: splitterBounds,
      direction: SplitterDirection.Vertical
    });
    this.notificationConsoleData = ko.observableArray<ConsoleData>([]);
    this.defaultExperience = ko.observable<string>();
    this.databaseAccount.subscribe((databaseAccount: ViewModels.DatabaseAccount) => {
      this.defaultExperience(DefaultExperienceUtility.getDefaultExperienceFromDatabaseAccount(databaseAccount));
    });

    this.isPreferredApiDocumentDB = ko.computed(() => {
      const defaultExperience = (this.defaultExperience && this.defaultExperience()) || "";
      return defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.DocumentDB.toLowerCase();
    });

    this.isPreferredApiCassandra = ko.computed(() => {
      const defaultExperience = (this.defaultExperience && this.defaultExperience()) || "";
      return defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.Cassandra.toLowerCase();
    });
    this.isPreferredApiGraph = ko.computed(() => {
      const defaultExperience = (this.defaultExperience && this.defaultExperience()) || "";
      return defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.Graph.toLowerCase();
    });

    this.isPreferredApiTable = ko.computed(() => {
      const defaultExperience = (this.defaultExperience && this.defaultExperience()) || "";
      return defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.Table.toLowerCase();
    });

    this.isFixedCollectionWithSharedThroughputSupported = ko.computed(() => {
      if (this.isFeatureEnabled(Constants.Features.enableFixedCollectionWithSharedThroughput)) {
        return true;
      }

      if (this.databaseAccount && !this.databaseAccount()) {
        return false;
      }

      const capabilities = this.databaseAccount().properties && this.databaseAccount().properties.capabilities;

      if (!capabilities) {
        return false;
      }

      for (let i = 0; i < capabilities.length; i++) {
        if (typeof capabilities[i] === "object") {
          if (capabilities[i].name === Constants.CapabilityNames.EnableMongo) {
            // version 3.6
            return true;
          }
        }
      }

      return false;
    });

    this.isPreferredApiMongoDB = ko.computed(() => {
      const defaultExperience = (this.defaultExperience && this.defaultExperience()) || "";
      if (defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.MongoDB.toLowerCase()) {
        return true;
      }

      if (defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.ApiForMongoDB.toLowerCase()) {
        return true;
      }

      if (
        this.databaseAccount &&
        this.databaseAccount() &&
        this.databaseAccount().kind.toLowerCase() === Constants.AccountKind.MongoDB
      ) {
        return true;
      }

      return false;
    });

    this.isHostedDataExplorerEnabled = ko.computed<boolean>(
      () =>
        this.getPlatformType() === PlatformType.Portal &&
        !this.isRunningOnNationalCloud() &&
        !this.isPreferredApiGraph()
    );
    this.defaultExperience.subscribe((defaultExperience: string) => {
      if (
        defaultExperience &&
        defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.Cassandra.toLowerCase()
      ) {
        const api = new CassandraApi();
        this._isSystemDatabasePredicate = api.isSystemDatabasePredicate;
      }
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

    this.nonSystemDatabases = ko.computed(() => {
      return this.databases().filter((database: ViewModels.Database) => !this._isSystemDatabasePredicate(database));
    });

    this.addDatabasePane = new AddDatabasePane({
      documentClientUtility: this.documentClientUtility,
      id: "adddatabasepane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.addCollectionPane = new AddCollectionPane({
      isPreferredApiTable: ko.computed(() => this.isPreferredApiTable()),
      documentClientUtility: this.documentClientUtility,
      id: "addcollectionpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.deleteCollectionConfirmationPane = new DeleteCollectionConfirmationPane({
      documentClientUtility: this.documentClientUtility,
      id: "deletecollectionconfirmationpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.deleteDatabaseConfirmationPane = new DeleteDatabaseConfirmationPane({
      documentClientUtility: this.documentClientUtility,
      id: "deletedatabaseconfirmationpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.graphStylingPane = new GraphStylingPane({
      documentClientUtility: this.documentClientUtility,
      id: "graphstylingpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.addTableEntityPane = new AddTableEntityPane({
      documentClientUtility: this.documentClientUtility,
      id: "addtableentitypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.editTableEntityPane = new EditTableEntityPane({
      documentClientUtility: this.documentClientUtility,
      id: "edittableentitypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.tableColumnOptionsPane = new TableColumnOptionsPane({
      documentClientUtility: this.documentClientUtility,
      id: "tablecolumnoptionspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.querySelectPane = new QuerySelectPane({
      documentClientUtility: this.documentClientUtility,
      id: "queryselectpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.newVertexPane = new NewVertexPane({
      documentClientUtility: this.documentClientUtility,
      id: "newvertexpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.cassandraAddCollectionPane = new CassandraAddCollectionPane({
      documentClientUtility: this.documentClientUtility,
      id: "cassandraaddcollectionpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.settingsPane = new SettingsPane({
      documentClientUtility: this.documentClientUtility,
      id: "settingspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.executeSprocParamsPane = new ExecuteSprocParamsPane({
      documentClientUtility: this.documentClientUtility,
      id: "executesprocparamspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.renewAdHocAccessPane = new RenewAdHocAccessPane({
      documentClientUtility: this.documentClientUtility,
      id: "renewadhocaccesspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.uploadItemsPane = new UploadItemsPane({
      documentClientUtility: this.documentClientUtility,
      id: "uploaditemspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.loadQueryPane = new LoadQueryPane({
      documentClientUtility: this.documentClientUtility,
      id: "loadquerypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.saveQueryPane = new SaveQueryPane({
      documentClientUtility: this.documentClientUtility,
      id: "savequerypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.browseQueriesPane = new BrowseQueriesPane({
      documentClientUtility: this.documentClientUtility,
      id: "browsequeriespane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.uploadFilePane = new UploadFilePane({
      documentClientUtility: this.documentClientUtility,
      id: "uploadfilepane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.stringInputPane = new StringInputPane({
      documentClientUtility: this.documentClientUtility,
      id: "stringinputpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.setupNotebooksPane = new SetupNotebooksPane({
      documentClientUtility: this.documentClientUtility,
      id: "setupnotebookspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.setupSparkClusterPane = new SetupSparkClusterPane({
      documentClientUtility: this.documentClientUtility,
      id: "setupsparkclusterpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.manageSparkClusterPane = new ManageSparkClusterPane({
      documentClientUtility: this.documentClientUtility,
      id: "managesparkclusterpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.libraryManagePane = new LibraryManagePane({
      documentClientUtility: this.documentClientUtility,
      id: "libraryManagePane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.clusterLibraryPane = new ClusterLibraryPane({
      documentClientUtility: this.documentClientUtility,
      id: "clusterLibraryPane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.openedTabs = ko.observableArray<ViewModels.Tab>([]);
    this.activeTab = ko.observable(null);
    this.isNotebookTabActive = ko.computed<boolean>(() => {
      // only show memory tracker if the current active tab is a notebook
      return this.activeTab() && this.activeTab().tabKind === ViewModels.CollectionTabKind.NotebookV2;
    });
    this._panes = [
      this.addDatabasePane,
      this.addCollectionPane,
      this.deleteCollectionConfirmationPane,
      this.deleteDatabaseConfirmationPane,
      this.graphStylingPane,
      this.addTableEntityPane,
      this.editTableEntityPane,
      this.tableColumnOptionsPane,
      this.querySelectPane,
      this.newVertexPane,
      this.cassandraAddCollectionPane,
      this.settingsPane,
      this.executeSprocParamsPane,
      this.renewAdHocAccessPane,
      this.uploadItemsPane,
      this.loadQueryPane,
      this.saveQueryPane,
      this.browseQueriesPane,
      this.uploadFilePane,
      this.stringInputPane,
      this.setupNotebooksPane,
      this.setupSparkClusterPane,
      this.manageSparkClusterPane
    ];
    this.addDatabaseText.subscribe((addDatabaseText: string) => this.addDatabasePane.title(addDatabaseText));
    this.rebindDocumentClientUtility.bind(this);
    this.isTabsContentExpanded = ko.observable(false);

    document.addEventListener(
      "contextmenu",
      function(e) {
        e.preventDefault();
      },
      false
    );

    $(function() {
      $(document.body).click(() => $(".commandDropdownContainer").hide());
    });

    // TODO move this to API customization class
    this.defaultExperience.subscribe(defaultExperience => {
      const defaultExperienceNormalizedString = (
        defaultExperience || Constants.DefaultAccountExperience.Default
      ).toLowerCase();

      switch (defaultExperienceNormalizedString) {
        case Constants.DefaultAccountExperience.DocumentDB.toLowerCase():
          this.addCollectionText("New Container");
          this.addDatabaseText("New Database");
          this.collectionTitle("SQL API");
          this.collectionTreeNodeAltText("Container");
          this.deleteCollectionText("Delete Container");
          this.deleteDatabaseText("Delete Database");
          this.addCollectionPane.title("Add Container");
          this.addCollectionPane.collectionIdTitle("Container id");
          this.addCollectionPane.collectionWithThroughputInSharedTitle(
            "Provision dedicated throughput for this container"
          );
          this.deleteCollectionConfirmationPane.title("Delete Container");
          this.deleteCollectionConfirmationPane.collectionIdConfirmationText("Confirm by typing the container id");
          this.refreshTreeTitle("Refresh containers");
          break;
        case Constants.DefaultAccountExperience.MongoDB.toLowerCase():
        case Constants.DefaultAccountExperience.ApiForMongoDB.toLowerCase():
          this.addCollectionText("New Collection");
          this.addDatabaseText("New Database");
          this.collectionTitle("Collections");
          this.collectionTreeNodeAltText("Collection");
          this.deleteCollectionText("Delete Collection");
          this.deleteDatabaseText("Delete Database");
          this.addCollectionPane.title("Add Collection");
          this.addCollectionPane.collectionIdTitle("Collection id");
          this.addCollectionPane.collectionWithThroughputInSharedTitle(
            "Provision dedicated throughput for this collection"
          );
          this.refreshTreeTitle("Refresh collections");
          break;
        case Constants.DefaultAccountExperience.Graph.toLowerCase():
          this.addCollectionText("New Graph");
          this.addDatabaseText("New Database");
          this.deleteCollectionText("Delete Graph");
          this.deleteDatabaseText("Delete Database");
          this.collectionTitle("Gremlin API");
          this.collectionTreeNodeAltText("Graph");
          this.addCollectionPane.title("Add Graph");
          this.addCollectionPane.collectionIdTitle("Graph id");
          this.addCollectionPane.collectionWithThroughputInSharedTitle("Provision dedicated throughput for this graph");
          this.deleteCollectionConfirmationPane.title("Delete Graph");
          this.deleteCollectionConfirmationPane.collectionIdConfirmationText("Confirm by typing the graph id");
          this.refreshTreeTitle("Refresh graphs");
          break;
        case Constants.DefaultAccountExperience.Table.toLowerCase():
          this.addCollectionText("New Table");
          this.addDatabaseText("New Database");
          this.deleteCollectionText("Delete Table");
          this.deleteDatabaseText("Delete Database");
          this.collectionTitle("Azure Table API");
          this.collectionTreeNodeAltText("Table");
          this.addCollectionPane.title("Add Table");
          this.addCollectionPane.collectionIdTitle("Table id");
          this.addCollectionPane.collectionWithThroughputInSharedTitle("Provision dedicated throughput for this table");
          this.refreshTreeTitle("Refresh tables");
          this.addTableEntityPane.title("Add Table Entity");
          this.editTableEntityPane.title("Edit Table Entity");
          this.deleteCollectionConfirmationPane.title("Delete Table");
          this.deleteCollectionConfirmationPane.collectionIdConfirmationText("Confirm by typing the table id");
          this.tableDataClient = new TablesAPIDataClient(this.documentClientUtility);
          break;
        case Constants.DefaultAccountExperience.Cassandra.toLowerCase():
          this.addCollectionText("New Table");
          this.addDatabaseText("New Keyspace");
          this.deleteCollectionText("Delete Table");
          this.deleteDatabaseText("Delete Keyspace");
          this.collectionTitle("Cassandra API");
          this.collectionTreeNodeAltText("Table");
          this.addCollectionPane.title("Add Table");
          this.addCollectionPane.collectionIdTitle("Table id");
          this.addCollectionPane.collectionWithThroughputInSharedTitle("Provision dedicated throughput for this table");
          this.refreshTreeTitle("Refresh tables");
          this.addTableEntityPane.title("Add Table Row");
          this.editTableEntityPane.title("Edit Table Row");
          this.deleteCollectionConfirmationPane.title("Delete Table");
          this.deleteCollectionConfirmationPane.collectionIdConfirmationText("Confirm by typing the table id");
          this.deleteDatabaseConfirmationPane.title("Delete Keyspace");
          this.deleteDatabaseConfirmationPane.databaseIdConfirmationText("Confirm by typing the keyspace id");
          this.tableDataClient = new CassandraAPIDataClient(this.documentClientUtility);
          break;
      }
    });

    this.commandBarComponentAdapter = new CommandBarComponentAdapter(this);
    this.notificationConsoleComponentAdapter = new NotificationConsoleComponentAdapter(this);

    this._initSettings();

    TelemetryProcessor.traceSuccess(
      Action.InitializeDataExplorer,
      { dataExplorerArea: Constants.Areas.ResourceTree },
      startKey
    );

    const junoClient = new JunoClient(this.databaseAccount);

    this.isNotebookEnabled = ko.observable(false);
    this.isNotebookEnabled.subscribe(async (isEnabled: boolean) => {
      this.refreshCommandBarButtons();

      this.gitHubOAuthService = new GitHubOAuthService(junoClient);

      const GitHubClientModule = await import(/* webpackChunkName: "GitHubClient" */ "../GitHub/GitHubClient");
      const gitHubClient = new GitHubClientModule.GitHubClient(config.AZURESAMPLESCOSMOSDBPAT, error => {
        Logger.logError(error, "Explorer/GitHubClient errorCallback");

        if (error.status === Constants.HttpStatusCodes.Unauthorized) {
          this.gitHubOAuthService?.resetToken();

          this.showOkCancelModalDialog(
            undefined,
            "Cosmos DB cannot access your Github account anymore. Please connect to GitHub again.",
            "Connect to GitHub",
            () => this.gitHubReposPane?.open(),
            "Cancel",
            undefined
          );
        }
      });

      this.gitHubReposPane = new GitHubReposPane({
        documentClientUtility: this.documentClientUtility,
        id: "gitHubReposPane",
        visible: ko.observable<boolean>(false),
        container: this,
        junoClient,
        gitHubClient
      });

      this.isGitHubPaneEnabled(true);

      this.gitHubOAuthService.getTokenObservable().subscribe(token => {
        gitHubClient.setToken(token?.access_token ? token.access_token : config.AZURESAMPLESCOSMOSDBPAT);

        if (this.gitHubReposPane?.visible()) {
          this.gitHubReposPane.open();
        }

        this.refreshCommandBarButtons();
        this.refreshNotebookList();
      });

      if (this.isGalleryEnabled()) {
        this.galleryTab = await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab");
        this.notebookViewerTab = await import(/* webpackChunkName: "NotebookViewerTab" */ "./Tabs/NotebookViewerTab");
      }

      const promptForCommitMsg = (title: string, primaryButtonLabel: string) => {
        return new Promise<string>((resolve, reject) => {
          let commitMsg: string = "Committed from Azure Cosmos DB Notebooks";
          this.showOkCancelTextFieldModalDialog(
            title || "Commit",
            undefined,
            primaryButtonLabel || "Commit",
            () => {
              TelemetryProcessor.trace(Action.NotebooksGitHubCommit, ActionModifiers.Mark, {
                databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
                defaultExperience: this.defaultExperience && this.defaultExperience(),
                dataExplorerArea: Constants.Areas.Notebook
              });
              resolve(commitMsg);
            },
            "Cancel",
            () => reject(new Error("Commit dialog canceled")),
            {
              label: "Commit message",
              autoAdjustHeight: true,
              multiline: true,
              defaultValue: commitMsg,
              rows: 3,
              onChange: (_, newValue: string) => {
                commitMsg = newValue;
                this._dialogProps().primaryButtonDisabled = !commitMsg;
                this._dialogProps.valueHasMutated();
              }
            },
            !commitMsg
          );
        });
      };

      const GitHubContentProviderModule = await import(
        /* webpackChunkName: "rx-jupyter" */ "../GitHub/GitHubContentProvider"
      );
      const RXJupyterModule = await import(/* webpackChunkName: "rx-jupyter" */ "rx-jupyter");
      this.notebookContentProvider = new NotebookContentProvider(
        new GitHubContentProviderModule.GitHubContentProvider({ gitHubClient, promptForCommitMsg }),
        RXJupyterModule.contents.JupyterContentProvider
      );

      const NotebookContainerClientModule = await import(
        /* webpackChunkName: "NotebookContainerClient" */ "./Notebook/NotebookContainerClient"
      );

      this.notebookClient = new NotebookContainerClientModule.NotebookContainerClient(
        this.notebookServerInfo,
        () => this.initNotebooks(this.databaseAccount()),
        (update: DataModels.MemoryUsageInfo) => this.memoryUsageInfo(update)
      );

      const NotebookContentClientModule = await import(
        /* webpackChunkName: "NotebookContentClient" */ "./Notebook/NotebookContentClient"
      );
      this.notebookContentClient = new NotebookContentClientModule.NotebookContentClient(
        this.notebookServerInfo,
        this.notebookBasePath,
        this.notebookContentProvider
      );

      this.refreshNotebookList();
    });

    this.isSparkEnabled = ko.observable(false);
    this.isSparkEnabled.subscribe((isEnabled: boolean) => this.refreshCommandBarButtons());
    this.resourceTree = new ResourceTreeAdapter(this, junoClient);
    this.resourceTreeForResourceToken = new ResourceTreeAdapterForResourceToken(this);
    this.notebookServerInfo = ko.observable<DataModels.NotebookWorkspaceConnectionInfo>({
      notebookServerEndpoint: undefined,
      authToken: undefined
    });
    this.notebookBasePath = ko.observable(Constants.Notebook.defaultBasePath);
    this.sparkClusterConnectionInfo = ko.observable<DataModels.SparkClusterConnectionInfo>({
      userName: undefined,
      password: undefined,
      endpoints: []
    });

    // Override notebook server parameters from URL parameters
    const featureSubcription = this.features.subscribe(features => {
      const serverInfo = this.notebookServerInfo();
      if (this.isFeatureEnabled(Constants.Features.notebookServerUrl)) {
        serverInfo.notebookServerEndpoint = features[Constants.Features.notebookServerUrl];
      }

      if (this.isFeatureEnabled(Constants.Features.notebookServerToken)) {
        serverInfo.authToken = features[Constants.Features.notebookServerToken];
      }
      this.notebookServerInfo(serverInfo);
      this.notebookServerInfo.valueHasMutated();

      if (this.isFeatureEnabled(Constants.Features.notebookBasePath)) {
        this.notebookBasePath(features[Constants.Features.notebookBasePath]);
      }

      if (this.isFeatureEnabled(Constants.Features.livyEndpoint)) {
        this.sparkClusterConnectionInfo({
          userName: undefined,
          password: undefined,
          endpoints: [
            {
              endpoint: features[Constants.Features.livyEndpoint],
              kind: DataModels.SparkClusterEndpointKind.Livy
            }
          ]
        });
        this.sparkClusterConnectionInfo.valueHasMutated();
      }

      this.enableLegacyResourceTree(this.isFeatureEnabled(Constants.Features.enableLegacyResourceTree));

      featureSubcription.dispose();
    });

    this._dialogProps = ko.observable<DialogProps>({
      isModal: false,
      visible: false,
      title: undefined,
      subText: undefined,
      primaryButtonText: undefined,
      secondaryButtonText: undefined,
      onPrimaryButtonClick: undefined,
      onSecondaryButtonClick: undefined
    });
    this.dialogComponentAdapter = new DialogComponentAdapter();
    this.dialogComponentAdapter.parameters = this._dialogProps;
    this.splashScreenAdapter = new SplashScreenComponentAdapter(this);
    this.mostRecentActivity = new MostRecentActivity.MostRecentActivity(this);

    this._addSynapseLinkDialogProps = ko.observable<DialogProps>({
      isModal: false,
      visible: false,
      title: undefined,
      subText: undefined,
      primaryButtonText: undefined,
      secondaryButtonText: undefined,
      onPrimaryButtonClick: undefined,
      onSecondaryButtonClick: undefined
    });
    this.addSynapseLinkDialog = new DialogComponentAdapter();
    this.addSynapseLinkDialog.parameters = this._addSynapseLinkDialogProps;
  }

  public openEnableSynapseLinkDialog(): void {
    const addSynapseLinkDialogProps: DialogProps = {
      linkProps: {
        linkText: "Learn more",
        linkUrl: "https://aka.ms/cosmosdb-synapselink"
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
        const logId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          "Enabling Azure Synapse Link for this account. This may take a few minutes before you can enable analytical store for this account."
        );
        this.isSynapseLinkUpdating(true);
        this._closeSynapseLinkModalDialog();

        const resourceProviderClient = new ResourceProviderClientFactory(this.armEndpoint()).getOrCreate(
          this.databaseAccount().id
        );

        try {
          const databaseAccount: ViewModels.DatabaseAccount = await resourceProviderClient.patchAsync(
            this.databaseAccount().id,
            "2019-12-12",
            {
              properties: {
                enableAnalyticalStorage: true
              }
            }
          );
          NotificationConsoleUtils.clearInProgressMessageWithId(logId);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            "Enabled Azure Synapse Link for this account"
          );
          TelemetryProcessor.traceSuccess(Action.EnableAzureSynapseLink, startTime);
          this.databaseAccount(databaseAccount);
        } catch (e) {
          NotificationConsoleUtils.clearInProgressMessageWithId(logId);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Enabling Azure Synapse Link for this account failed. ${e.message || JSON.stringify(e)}`
          );
          TelemetryProcessor.traceFailure(Action.EnableAzureSynapseLink, startTime);
        } finally {
          this.isSynapseLinkUpdating(false);
        }
      },

      onSecondaryButtonClick: () => {
        this._closeSynapseLinkModalDialog();
        TelemetryProcessor.traceCancel(Action.EnableAzureSynapseLink);
      }
    };
    this._addSynapseLinkDialogProps(addSynapseLinkDialogProps);
    TelemetryProcessor.traceStart(Action.EnableAzureSynapseLink);

    // TODO: return result
  }

  public rebindDocumentClientUtility(documentClientUtility: DocumentClientUtilityBase): void {
    this.documentClientUtility = documentClientUtility;
    this._panes.forEach((pane: ViewModels.ContextualPane) => {
      pane.documentClientUtility = documentClientUtility;
    });
  }

  public copyUrlLink(src: any, event: MouseEvent): void {
    const urlLinkInput: HTMLInputElement = document.getElementById("shareUrlLink") as HTMLInputElement;
    urlLinkInput && urlLinkInput.select();
    document.execCommand("copy");
    this.shareUrlCopyHelperText("Copied");
    setTimeout(() => this.shareUrlCopyHelperText("Click to copy"), Constants.ClientDefaults.copyHelperTimeoutMs);

    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Copy full screen URL",
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience && this.defaultExperience(),
      dataExplorerArea: Constants.Areas.ShareDialog
    });
  }

  public onCopyUrlLinkKeyPress(src: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.copyUrlLink(src, null);
      return false;
    }

    return true;
  }

  public copyToken(src: any, event: MouseEvent): void {
    const tokenInput: HTMLInputElement = document.getElementById("shareToken") as HTMLInputElement;
    tokenInput && tokenInput.select();
    document.execCommand("copy");
    this.shareTokenCopyHelperText("Copied");
    setTimeout(() => this.shareTokenCopyHelperText("Click to copy"), Constants.ClientDefaults.copyHelperTimeoutMs);
  }

  public onCopyTokenKeyPress(src: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.copyToken(src, null);
      return false;
    }

    return true;
  }

  public renewToken = (): void => {
    TelemetryProcessor.trace(Action.ConnectEncryptionToken);
    this.renewTokenError("");
    const id: string = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Initiating connection to account"
    );
    this.renewExplorerShareAccess(this, this.tokenForRenewal())
      .fail((error: any) => {
        const stringifiedError: string = JSON.stringify(error);
        this.renewTokenError("Invalid connection string specified");
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to initiate connection to account: ${stringifiedError}`
        );
      })
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(id));
  };

  public generateSharedAccessData(): void {
    const id: string = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Generating share url");
    AuthHeadersUtil.generateEncryptedToken().then(
      (tokenResponse: DataModels.GenerateTokenResponse) => {
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, "Successfully generated share url");
        this.shareAccessData({
          readWriteUrl: this._getShareAccessUrlForToken(tokenResponse.readWrite),
          readUrl: this._getShareAccessUrlForToken(tokenResponse.read)
        });
        !this.shareAccessData().readWriteUrl && this.shareAccessToggleState(ShareAccessToggleState.Read); // select read toggle by default for readers
        this.shareAccessToggleState.valueHasMutated(); // to set initial url and token state
        this.shareAccessData.valueHasMutated();
        this._openShareDialog();
      },
      (error: any) => {
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to generate share url: ${JSON.stringify(error)}`
        );
        console.error(error);
      }
    );
  }

  public renewShareAccess(token: string): Q.Promise<void> {
    if (!this.renewExplorerShareAccess) {
      return Q.reject("Not implemented");
    }

    const deferred: Q.Deferred<void> = Q.defer<void>();
    const id: string = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Initiating connection to account"
    );
    this.renewExplorerShareAccess(this, token)
      .then(
        () => {
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, "Connection successful");
          this.renewAdHocAccessPane && this.renewAdHocAccessPane.close();
          deferred.resolve();
        },
        (error: any) => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Failed to connect: ${JSON.stringify(error)}`
          );
          deferred.reject(error);
        }
      )
      .finally(() => {
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
      });

    return deferred.promise;
  }

  public displayGuestAccessTokenRenewalPrompt(): void {
    if (!$("#dataAccessTokenModal").dialog("instance")) {
      const connectButton = {
        text: "Connect",
        class: "connectDialogButtons connectButton connectOkBtns",
        click: () => {
          this.renewAdHocAccessPane.open();
          $("#dataAccessTokenModal").dialog("close");
        }
      };
      const cancelButton = {
        text: "Cancel",
        class: "connectDialogButtons cancelBtn",
        click: () => {
          $("#dataAccessTokenModal").dialog("close");
        }
      };

      $("#dataAccessTokenModal").dialog({
        autoOpen: false,
        buttons: [connectButton, cancelButton],
        closeOnEscape: false,
        draggable: false,
        dialogClass: "no-close",
        height: 180,
        modal: true,
        position: { my: "center center", at: "center center", of: window },
        resizable: false,
        title: "Temporary access expired",
        width: 435,
        close: (event: Event, ui: JQueryUI.DialogUIParams) => this.shouldShowDataAccessExpiryDialog(false)
      });
      $("#dataAccessTokenModal").dialog("option", "classes", {
        "ui-dialog-titlebar": "connectTitlebar"
      });
    }
    this.shouldShowDataAccessExpiryDialog(true);
    $("#dataAccessTokenModal").dialog("open");
  }

  public isConnectExplorerVisible(): boolean {
    return $("#connectExplorer").is(":visible") || false;
  }

  public displayContextSwitchPromptForConnectionString(connectionString: string): void {
    const yesButton = {
      text: "OK",
      class: "connectDialogButtons okBtn connectOkBtns",
      click: () => {
        $("#contextSwitchPrompt").dialog("close");
        this.openedTabs([]); // clear all tabs so we dont leave any tabs from previous session open
        this.renewShareAccess(connectionString);
      }
    };
    const noButton = {
      text: "Cancel",
      class: "connectDialogButtons cancelBtn",
      click: () => {
        $("#contextSwitchPrompt").dialog("close");
      }
    };

    if (!$("#contextSwitchPrompt").dialog("instance")) {
      $("#contextSwitchPrompt").dialog({
        autoOpen: false,
        buttons: [yesButton, noButton],
        closeOnEscape: false,
        draggable: false,
        dialogClass: "no-close",
        height: 255,
        modal: true,
        position: { my: "center center", at: "center center", of: window },
        resizable: false,
        title: "Switch account",
        width: 440,
        close: (event: Event, ui: JQueryUI.DialogUIParams) => this.shouldShowDataAccessExpiryDialog(false)
      });
      $("#contextSwitchPrompt").dialog("option", "classes", {
        "ui-dialog-titlebar": "connectTitlebar"
      });
      $("#contextSwitchPrompt").dialog("option", "open", (event: Event, ui: JQueryUI.DialogUIParams) => {
        $(".ui-dialog ").css("z-index", 1001);
        $("#contextSwitchPrompt")
          .parent()
          .siblings(".ui-widget-overlay")
          .css("z-index", 1000);
      });
    }
    $("#contextSwitchPrompt").dialog("option", "buttons", [yesButton, noButton]); // rebind buttons so callbacks accept current connection string
    this.shouldShowContextSwitchPrompt(true);
    $("#contextSwitchPrompt").dialog("open");
  }

  public displayConnectExplorerForm(): void {
    $("#divExplorer").hide();
    $("#connectExplorer").css("display", "flex");
  }

  public hideConnectExplorerForm(): void {
    $("#connectExplorer").hide();
    $("#divExplorer").show();
  }

  public isReadWriteToggled: () => boolean = (): boolean => {
    return this.shareAccessToggleState() === ShareAccessToggleState.ReadWrite;
  };

  public isReadToggled: () => boolean = (): boolean => {
    return this.shareAccessToggleState() === ShareAccessToggleState.Read;
  };

  public toggleReadWrite: (src: any, event: MouseEvent) => void = (src: any, event: MouseEvent) => {
    this.shareAccessToggleState(ShareAccessToggleState.ReadWrite);
  };

  public toggleRead: (src: any, event: MouseEvent) => void = (src: any, event: MouseEvent) => {
    this.shareAccessToggleState(ShareAccessToggleState.Read);
  };

  public onToggleKeyDown: (src: any, event: KeyboardEvent) => boolean = (src: any, event: KeyboardEvent) => {
    if (event.keyCode === Constants.KeyCodes.LeftArrow) {
      this.toggleReadWrite(src, null);
      return false;
    } else if (event.keyCode === Constants.KeyCodes.RightArrow) {
      this.toggleRead(src, null);
      return false;
    }
    return true;
  };

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

  public isFeatureEnabled(feature: string): boolean {
    const features = this.features();

    if (!features) {
      return false;
    }

    if (feature in features && features[feature]) {
      return true;
    }

    return false;
  }

  public logConsoleData(consoleData: ConsoleData): void {
    this.notificationConsoleData.splice(0, 0, consoleData);
  }

  public deleteInProgressConsoleDataWithId(id: string): void {
    const updatedConsoleData = _.reject(
      this.notificationConsoleData(),
      (data: ConsoleData) => data.type === ConsoleDataType.InProgress && data.id === id
    );
    this.notificationConsoleData(updatedConsoleData);
  }

  public expandConsole(): void {
    this.isNotificationConsoleExpanded(true);
  }

  public collapseConsole(): void {
    this.isNotificationConsoleExpanded(false);
  }

  public toggleLeftPaneExpanded() {
    this.isLeftPaneExpanded(!this.isLeftPaneExpanded());

    if (this.isLeftPaneExpanded()) {
      document.getElementById("expandToggleLeftPaneButton").focus();
      this.splitter.expandLeft();
    } else {
      document.getElementById("collapseToggleLeftPaneButton").focus();
      this.splitter.collapseLeft();
    }
  }

  public refreshDatabaseForResourceToken(): Q.Promise<any> {
    const databaseId = this.resourceTokenDatabaseId();
    const collectionId = this.resourceTokenCollectionId();
    if (!databaseId || !collectionId) {
      return Q.reject();
    }

    const deferred: Q.Deferred<void> = Q.defer();
    this.documentClientUtility.readCollection(databaseId, collectionId).then((collection: DataModels.Collection) => {
      this.resourceTokenCollection(new ResourceTokenCollection(this, databaseId, collection));
      this.selectedNode(this.resourceTokenCollection());
      deferred.resolve();
    });

    return deferred.promise;
  }

  public refreshAllDatabases(isInitialLoad?: boolean): Q.Promise<any> {
    this.isRefreshingExplorer(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience && this.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
    let resourceTreeStartKey: number = null;
    if (isInitialLoad) {
      resourceTreeStartKey = TelemetryProcessor.traceStart(Action.LoadResourceTree, {
        databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
        defaultExperience: this.defaultExperience && this.defaultExperience(),
        dataExplorerArea: Constants.Areas.ResourceTree
      });
    }
    // TODO: Refactor
    const deferred: Q.Deferred<any> = Q.defer();
    const offerPromise: Q.Promise<DataModels.Offer[]> = this.documentClientUtility.readOffers();
    this._setLoadingStatusText("Fetching offers...");

    offerPromise.then(
      (offers: DataModels.Offer[]) => {
        this._setLoadingStatusText("Successfully fetched offers.");
        this._setLoadingStatusText("Fetching databases...");
        this.documentClientUtility.readDatabases(null /*options*/).then(
          (databases: DataModels.Database[]) => {
            this._setLoadingStatusText("Successfully fetched databases.");
            TelemetryProcessor.traceSuccess(
              Action.LoadDatabases,
              {
                databaseAccountName: this.databaseAccount().name,
                defaultExperience: this.defaultExperience(),
                dataExplorerArea: Constants.Areas.ResourceTree
              },
              startKey
            );
            const currentlySelectedNode: ViewModels.TreeNode = this.selectedNode();
            const deltaDatabases = this.getDeltaDatabases(databases, offers);
            this.addDatabasesToList(deltaDatabases.toAdd);
            this.deleteDatabasesFromList(deltaDatabases.toDelete);
            this.selectedNode(currentlySelectedNode);
            this._setLoadingStatusText("Fetching containers...");
            this.refreshAndExpandNewDatabases(deltaDatabases.toAdd)
              .then(
                () => {
                  this._setLoadingStatusText("Successfully fetched containers.");
                  deferred.resolve();
                },
                reason => {
                  this._setLoadingStatusText("Failed to fetch containers.");
                  deferred.reject(reason);
                }
              )
              .finally(() => this.isRefreshingExplorer(false));
          },
          error => {
            this._setLoadingStatusText("Failed to fetch databases.");
            this.isRefreshingExplorer(false);
            deferred.reject(error);
            TelemetryProcessor.traceFailure(
              Action.LoadDatabases,
              {
                databaseAccountName: this.databaseAccount().name,
                defaultExperience: this.defaultExperience(),
                dataExplorerArea: Constants.Areas.ResourceTree,
                error: JSON.stringify(error)
              },
              startKey
            );
            NotificationConsoleUtils.logConsoleMessage(
              ConsoleDataType.Error,
              `Error while refreshing databases: ${JSON.stringify(error)}`
            );
          }
        );
      },
      error => {
        this._setLoadingStatusText("Failed to fetch offers.");
        this.isRefreshingExplorer(false);
        deferred.reject(error);
        TelemetryProcessor.traceFailure(
          Action.LoadDatabases,
          {
            databaseAccountName: this.databaseAccount().name,
            defaultExperience: this.defaultExperience(),
            dataExplorerArea: Constants.Areas.ResourceTree,
            error: JSON.stringify(error)
          },
          startKey
        );
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while refreshing databases: ${JSON.stringify(error)}`
        );
      }
    );

    return deferred.promise.then(
      () => {
        if (resourceTreeStartKey != null) {
          TelemetryProcessor.traceSuccess(
            Action.LoadResourceTree,
            {
              databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
              defaultExperience: this.defaultExperience && this.defaultExperience(),
              dataExplorerArea: Constants.Areas.ResourceTree
            },
            resourceTreeStartKey
          );
        }
      },
      reason => {
        if (resourceTreeStartKey != null) {
          TelemetryProcessor.traceFailure(
            Action.LoadResourceTree,
            {
              databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
              defaultExperience: this.defaultExperience && this.defaultExperience(),
              dataExplorerArea: Constants.Areas.ResourceTree,
              error: reason
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
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience && this.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
    this.isRefreshingExplorer(true);
    this.documentClientUtility.refreshCachedResources().then(
      () => {
        TelemetryProcessor.traceSuccess(
          Action.LoadDatabases,
          {
            description: "Refresh successful",
            databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
            defaultExperience: this.defaultExperience && this.defaultExperience(),
            dataExplorerArea: Constants.Areas.ResourceTree
          },
          startKey
        );
        this.isAuthWithResourceToken() ? this.refreshDatabaseForResourceToken() : this.refreshAllDatabases();
      },
      (error: any) => {
        this.isRefreshingExplorer(false);
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while refreshing data: ${JSON.stringify(error)}`
        );
        TelemetryProcessor.traceFailure(
          Action.LoadDatabases,
          {
            description: "Unable to refresh cached resources",
            databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
            defaultExperience: this.defaultExperience && this.defaultExperience(),
            dataExplorerArea: Constants.Areas.ResourceTree,
            error: error
          },
          startKey
        );
        throw error;
      }
    );

    this.refreshNotebookList();
  };

  public toggleLeftPaneExpandedKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.toggleLeftPaneExpanded();
      return false;
    }
    return true;
  };

  // Facade
  public provideFeedbackEmail = () => {
    window.open(Constants.Urls.feedbackEmail, "_self");
  };

  public async initSparkConnectionInfo(databaseAccount: DataModels.DatabaseAccount) {
    if (!databaseAccount) {
      throw new Error("No database account specified");
    }

    if (this._isInitializingSparkConnectionInfo) {
      return;
    }
    this._isInitializingSparkConnectionInfo = true;

    let connectionInfo: DataModels.SparkClusterConnectionInfo;
    try {
      connectionInfo = await this.sparkClusterManager.getClusterConnectionInfoAsync(databaseAccount.id, "default");
    } catch (error) {
      this._isInitializingSparkConnectionInfo = false;
      Logger.logError(error, "initSparkConnectionInfo/getClusterConnectionInfoAsync");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to get cluster connection info: ${JSON.stringify(error)}`
      );
      throw error;
    } finally {
      // Overwrite with feature flags
      if (this.isFeatureEnabled(Constants.Features.livyEndpoint)) {
        connectionInfo = {
          userName: undefined,
          password: undefined,
          endpoints: [
            {
              kind: DataModels.SparkClusterEndpointKind.Livy,
              endpoint: this.features()[Constants.Features.livyEndpoint]
            }
          ]
        };
      }
    }

    this.sparkClusterConnectionInfo(connectionInfo);
    this.sparkClusterConnectionInfo.valueHasMutated();
    this._isInitializingSparkConnectionInfo = false;
  }

  public deleteCluster() {
    if (!this.isSparkEnabled() || !this.sparkClusterManager) {
      return;
    }

    const deleteClusterDialogProps: DialogProps = {
      isModal: true,
      visible: true,
      title: "Delete Cluster",
      subText:
        "This will delete the default cluster associated with this account and interrupt any scheduled jobs. Proceed anyway?",
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
      onPrimaryButtonClick: async () => {
        this._closeModalDialog();
        await this._deleteCluster();
      },
      onSecondaryButtonClick: this._closeModalDialog
    };
    this._dialogProps(deleteClusterDialogProps);
  }

  public async getArcadiaToken(): Promise<string> {
    return new Promise<string>((resolve: (token: string) => void, reject: (error: any) => void) => {
      MessageHandler.sendCachedDataMessage<string>(MessageTypes.GetArcadiaToken, undefined /** params **/).then(
        (token: string) => {
          resolve(token);
        },
        (error: any) => {
          Logger.logError(error, "Explorer/getArcadiaToken");
          resolve(undefined);
        }
      );
    });
  }

  private async _getArcadiaWorkspaces(): Promise<ArcadiaWorkspaceItem[]> {
    try {
      const workspaces = await this._arcadiaManager.listWorkspacesAsync([CosmosClient.subscriptionId()]);
      let workspaceItems: ArcadiaWorkspaceItem[] = new Array(workspaces.length);
      const sparkPromises: Promise<void>[] = [];
      workspaces.forEach((workspace, i) => {
        let promise = this._arcadiaManager.listSparkPoolsAsync(workspaces[i].id).then(
          sparkpools => {
            workspaceItems[i] = { ...workspace, sparkPools: sparkpools };
          },
          error => {
            Logger.logError(error, "Explorer/this._arcadiaManager.listSparkPoolsAsync");
          }
        );
        sparkPromises.push(promise);
      });

      return Promise.all(sparkPromises).then(() => workspaceItems);
    } catch (error) {
      Logger.logError(error, "Explorer/this._arcadiaManager.listWorkspacesAsync");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, JSON.stringify(error));
      return Promise.resolve([]);
    }
  }

  public async createWorkspace(): Promise<string> {
    return MessageHandler.sendCachedDataMessage(MessageTypes.CreateWorkspace, undefined /** params **/);
  }

  public async createSparkPool(workspaceId: string): Promise<string> {
    return MessageHandler.sendCachedDataMessage(MessageTypes.CreateSparkPool, [workspaceId]);
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
      notebookServerEndpoint: undefined
    };
    try {
      connectionInfo = await this.notebookWorkspaceManager.getNotebookConnectionInfoAsync(
        databaseAccount.id,
        "default"
      );
    } catch (error) {
      this._isInitializingNotebooks = false;
      Logger.logError(error, "initNotebooks/getNotebookConnectionInfoAsync");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to get notebook workspace connection info: ${JSON.stringify(error)}`
      );
      throw error;
    } finally {
      // Overwrite with feature flags
      if (this.isFeatureEnabled(Constants.Features.notebookServerUrl)) {
        connectionInfo.notebookServerEndpoint = this.features()[Constants.Features.notebookServerUrl];
      }

      if (this.isFeatureEnabled(Constants.Features.notebookServerToken)) {
        connectionInfo.authToken = this.features()[Constants.Features.notebookServerToken];
      }

      this.notebookServerInfo(connectionInfo);
      this.notebookServerInfo.valueHasMutated();
      this.refreshNotebookList();
    }

    this._isInitializingNotebooks = false;
  }

  public resetNotebookWorkspace() {
    if (!this.isNotebookEnabled() || !this.notebookClient) {
      const error = "Attempt to reset notebook workspace, but notebook is not enabled";
      Logger.logError(error, "Explorer/resetNotebookWorkspace");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
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
      onSecondaryButtonClick: this._closeModalDialog
    };
    this._dialogProps(resetConfirmationDialogProps);
  }

  private async _containsDefaultNotebookWorkspace(databaseAccount: DataModels.DatabaseAccount): Promise<boolean> {
    if (!databaseAccount) {
      return false;
    }

    try {
      const workspaces = await this.notebookWorkspaceManager.getNotebookWorkspacesAsync(databaseAccount.id);
      return workspaces && workspaces.length > 0 && workspaces.some(workspace => workspace.name === "default");
    } catch (error) {
      Logger.logError(error, "Explorer/_containsDefaultNotebookWorkspace");
      return false;
    }
  }

  private async ensureNotebookWorkspaceRunning() {
    if (!this.databaseAccount()) {
      return;
    }

    try {
      const notebookWorkspace = await this.notebookWorkspaceManager.getNotebookWorkspaceAsync(
        this.databaseAccount().id,
        "default"
      );
      if (
        notebookWorkspace &&
        notebookWorkspace.properties &&
        notebookWorkspace.properties.status &&
        notebookWorkspace.properties.status.toLowerCase() === "stopped"
      ) {
        await this.notebookWorkspaceManager.startNotebookWorkspaceAsync(this.databaseAccount().id, "default");
      }
    } catch (error) {
      Logger.logError(error, "Explorer/ensureNotebookWorkspaceRunning");
    }
  }

  private _deleteCluster = async () => {
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteSparkCluster, {
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Deleting the default spark cluster associated with this account"
    );
    try {
      await this.sparkClusterManager.deleteClusterAsync(this.databaseAccount().id, "default");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        "Successfully deleted the default spark cluster associated with this account"
      );
      TelemetryProcessor.traceSuccess(
        Action.DeleteSparkCluster,
        {
          databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
          defaultExperience: this.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree
        },
        startKey
      );
    } catch (error) {
      const errorMessage = JSON.stringify(error);
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to delete default spark cluster: ${errorMessage}`
      );
      TelemetryProcessor.traceFailure(
        Action.DeleteSparkCluster,
        {
          databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
          defaultExperience: this.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
          error,
          errorMessage
        },
        startKey
      );
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  };

  private _resetNotebookWorkspace = async () => {
    this._closeModalDialog();
    const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Resetting notebook workspace");
    try {
      await this.notebookClient.resetWorkspace();
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, "Successfully reset notebook workspace");
      TelemetryProcessor.traceSuccess(Action.ResetNotebookWorkspace);
    } catch (error) {
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, `Failed to reset notebook workspace: ${error}`);
      TelemetryProcessor.traceFailure(Action.ResetNotebookWorkspace, error);
      throw error;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  };

  private _closeModalDialog = () => {
    this._dialogProps().visible = false;
    this._dialogProps.valueHasMutated();
  };

  private _closeSynapseLinkModalDialog = () => {
    this._addSynapseLinkDialogProps().visible = false;
    this._addSynapseLinkDialogProps.valueHasMutated();
  };

  private _shouldProcessMessage(event: MessageEvent): boolean {
    if (typeof event.data !== "object") {
      return false;
    }
    if (event.data["signature"] !== "pcIframe") {
      return false;
    }
    if (!("data" in event.data)) {
      return false;
    }
    if (typeof event.data["data"] !== "object") {
      return false;
    }

    // before initialization completed give exception
    const message = event.data.data;
    if (!this._importExplorerConfigComplete && message && message.type) {
      const messageType = message.type;
      switch (messageType) {
        case MessageTypes.SendNotification:
        case MessageTypes.ClearNotification:
        case MessageTypes.LoadingStatus:
          return true;
      }
    }
    if (!("inputs" in event.data["data"]) && !this._importExplorerConfigComplete) {
      return false;
    }
    return true;
  }

  public handleMessage(event: MessageEvent) {
    if (isInvalidParentFrameOrigin(event)) {
      return;
    }

    if (!this._shouldProcessMessage(event)) {
      return;
    }

    const message: any = event.data.data;
    const inputs: ViewModels.DataExplorerInputsFrame = message.inputs;

    const isRunningInPortal = window.dataExplorerPlatform == PlatformType.Portal;
    const isRunningInDevMode = process.env.NODE_ENV === "development";
    if (inputs && config.BACKEND_ENDPOINT && isRunningInPortal && isRunningInDevMode) {
      inputs.extensionEndpoint = config.PROXY_PATH;
    }

    const initPromise: Q.Promise<void> = inputs ? this.initDataExplorerWithFrameInputs(inputs) : Q();

    initPromise.then(() => {
      const openAction: ActionContracts.DataExplorerAction = message.openAction;
      if (!!openAction) {
        if (this.isRefreshingExplorer()) {
          const subscription = this.databases.subscribe((databases: ViewModels.Database[]) => {
            handleOpenAction(openAction, this.nonSystemDatabases(), this);
            subscription.dispose();
          });
        } else {
          handleOpenAction(openAction, this.nonSystemDatabases(), this);
        }
      }
      if (message.actionType === ActionContracts.ActionType.TransmitCachedData) {
        MessageHandler.handleCachedDataMessage(message);
        return;
      }
      if (message.type) {
        switch (message.type) {
          case MessageTypes.UpdateLocationHash:
            if (!message.locationHash) {
              break;
            }
            hasher.replaceHash(message.locationHash);
            RouteHandler.getInstance().parseHash(message.locationHash);
            break;
          case MessageTypes.SendNotification:
            if (!message.message) {
              break;
            }
            NotificationConsoleUtils.logConsoleMessage(
              message.consoleDataType || ConsoleDataType.Info,
              message.message,
              message.id
            );
            break;
          case MessageTypes.ClearNotification:
            if (!message.id) {
              break;
            }
            NotificationConsoleUtils.clearInProgressMessageWithId(message.id);
            break;
          case MessageTypes.LoadingStatus:
            if (!message.text) {
              break;
            }
            this._setLoadingStatusText(message.text, message.title);
            break;
        }
        return;
      }

      this.splashScreenAdapter.forceRender();
    });
  }

  public findSelectedDatabase(): ViewModels.Database {
    if (this.selectedNode().nodeKind === "Database") {
      return _.find(this.databases(), (database: ViewModels.Database) => database.rid === this.selectedNode().rid);
    }
    return this.findSelectedCollection().database;
  }

  public findDatabaseWithId(databaseId: string): ViewModels.Database {
    return _.find(this.databases(), (database: ViewModels.Database) => database.id() === databaseId);
  }

  public isLastNonEmptyDatabase(): boolean {
    if (this.isLastDatabase() && this.databases()[0].collections && this.databases()[0].collections().length > 0) {
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

  public initDataExplorerWithFrameInputs(inputs: ViewModels.DataExplorerInputsFrame): Q.Promise<void> {
    if (inputs != null) {
      const authorizationToken = inputs.authorizationToken || "";
      const masterKey = inputs.masterKey || "";
      const databaseAccount = inputs.databaseAccount || null;
      if (inputs.defaultCollectionThroughput) {
        this.collectionCreationDefaults = inputs.defaultCollectionThroughput;
      }
      this.features(inputs.features);
      this.serverId(inputs.serverId);
      this.extensionEndpoint(inputs.extensionEndpoint || "");
      this.armEndpoint(EnvironmentUtility.normalizeArmEndpointUri(inputs.csmEndpoint || config.ARM_ENDPOINT));
      this.notificationsClient.setExtensionEndpoint(this.extensionEndpoint());
      this.databaseAccount(databaseAccount);
      this.subscriptionType(inputs.subscriptionType);
      this.quotaId(inputs.quotaId);
      this.hasWriteAccess(inputs.hasWriteAccess);
      this.flight(inputs.addCollectionDefaultFlight);
      this.isTryCosmosDBSubscription(inputs.isTryCosmosDBSubscription);
      this.isAuthWithResourceToken(inputs.isAuthWithresourceToken);

      if (!!inputs.dataExplorerVersion) {
        this.parentFrameDataExplorerVersion(inputs.dataExplorerVersion);
      }

      this._importExplorerConfigComplete = true;

      CosmosClient.authorizationToken(authorizationToken);
      CosmosClient.masterKey(masterKey);
      CosmosClient.databaseAccount(databaseAccount);
      CosmosClient.subscriptionId(inputs.subscriptionId);
      CosmosClient.resourceGroup(inputs.resourceGroup);
      TelemetryProcessor.traceSuccess(
        Action.LoadDatabaseAccount,
        {
          resourceId: this.databaseAccount && this.databaseAccount().id,
          dataExplorerArea: Constants.Areas.ResourceTree,
          databaseAccount: this.databaseAccount && this.databaseAccount()
        },
        inputs.loadDatabaseAccountTimestamp
      );

      this.isAccountReady(true);
    }
    return Q();
  }

  public findActiveTab(): ViewModels.Tab {
    return this.activeTab();
  }

  public findSelectedCollection(): ViewModels.Collection {
    if (this.selectedNode().nodeKind === "Collection") {
      return this.findSelectedCollectionForSelectedNode();
    } else {
      return this.findSelectedCollectionForSubNode();
    }
  }

  // TODO: Refactor below methods, minimize dependencies and add unit tests where necessary
  public findSelectedStoredProcedure(): ViewModels.StoredProcedure {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.storedProcedures(), (storedProcedure: ViewModels.StoredProcedure) => {
      const openedSprocTab = this.openedTabs().filter(
        (tab: ViewModels.Tab) =>
          tab.node &&
          tab.node.rid === storedProcedure.rid &&
          tab.tabKind === ViewModels.CollectionTabKind.StoredProcedures
      );
      return (
        storedProcedure.rid === this.selectedNode().rid ||
        (!!openedSprocTab && openedSprocTab.length > 0 && openedSprocTab[0].isActive())
      );
    });
  }

  public findSelectedUDF(): ViewModels.UserDefinedFunction {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.userDefinedFunctions(), (userDefinedFunction: ViewModels.UserDefinedFunction) => {
      const openedUdfTab = this.openedTabs().filter(
        (tab: ViewModels.Tab) =>
          tab.node &&
          tab.node.rid === userDefinedFunction.rid &&
          tab.tabKind === ViewModels.CollectionTabKind.UserDefinedFunctions
      );
      return (
        userDefinedFunction.rid === this.selectedNode().rid ||
        (!!openedUdfTab && openedUdfTab.length > 0 && openedUdfTab[0].isActive())
      );
    });
  }

  public findSelectedTrigger(): ViewModels.Trigger {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.triggers(), (trigger: ViewModels.Trigger) => {
      const openedTriggerTab = this.openedTabs().filter(
        (tab: ViewModels.Tab) =>
          tab.node && tab.node.rid === trigger.rid && tab.tabKind === ViewModels.CollectionTabKind.Triggers
      );
      return (
        trigger.rid === this.selectedNode().rid ||
        (!!openedTriggerTab && openedTriggerTab.length > 0 && openedTriggerTab[0].isActive())
      );
    });
  }

  public closeAllTabsForResource(resourceId: string): void {
    const currentlyActiveTabs = this.openedTabs().filter((tab: ViewModels.Tab) => tab.isActive && tab.isActive());
    currentlyActiveTabs.forEach((tab: ViewModels.Tab) => tab.isActive(false));
    this.activeTab(null);
    const openedTabsForResource = this.openedTabs().filter(
      (tab: ViewModels.Tab) => tab.node && tab.node.rid === resourceId
    );
    openedTabsForResource.forEach((tab: ViewModels.Tab) => tab.onCloseTabButtonClick());
  }

  public closeAllPanes(): void {
    this._panes.forEach((pane: ViewModels.ContextualPane) => pane.close());
  }

  public getPlatformType(): PlatformType {
    return window.dataExplorerPlatform;
  }

  public isRunningOnNationalCloud(): boolean {
    return (
      this.serverId() === Constants.ServerIds.blackforest ||
      this.serverId() === Constants.ServerIds.fairfax ||
      this.serverId() === Constants.ServerIds.mooncake
    );
  }

  public onUpdateTabsButtons(buttons: ViewModels.NavbarButtonConfig[]): void {
    this.commandBarComponentAdapter.onUpdateTabsButtons(buttons);
  }

  public signInAad = () => {
    TelemetryProcessor.trace(Action.SignInAad, undefined, { area: "Explorer" });
    MessageHandler.sendMessage({
      type: MessageTypes.AadSignIn
    });
  };

  public onSwitchToConnectionString = () => {
    $("#connectWithAad").hide();
    $("#connectWithConnectionString").show();
  };

  public clickHostedAccountSwitch = () => {
    MessageHandler.sendMessage({
      type: MessageTypes.UpdateAccountSwitch,
      click: true
    });
  };

  public clickHostedDirectorySwitch = () => {
    MessageHandler.sendMessage({
      type: MessageTypes.UpdateDirectoryControl,
      click: true
    });
  };

  public refreshDatabaseAccount = () => {
    MessageHandler.sendMessage({
      type: MessageTypes.RefreshDatabaseAccount
    });
  };

  private refreshAndExpandNewDatabases(newDatabases: ViewModels.Database[]): Q.Promise<void> {
    // we reload collections for all databases so the resource tree reflects any collection-level changes
    // i.e addition of stored procedures, etc.
    const deferred: Q.Deferred<void> = Q.defer<void>();
    let loadCollectionPromises: Q.Promise<void>[] = [];

    // If the user has a lot of databases, only load expanded databases.
    const databasesToLoad =
      this.databases().length <= Explorer.MaxNbDatabasesToAutoExpand
        ? this.databases()
        : this.databases().filter(db => db.isDatabaseExpanded());

    const startKey: number = TelemetryProcessor.traceStart(Action.LoadCollections, {
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience && this.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree
    });
    databasesToLoad.forEach((database: ViewModels.Database) => {
      loadCollectionPromises.push(
        database.loadCollections().finally(() => {
          const isNewDatabase: boolean = _.some(newDatabases, (db: ViewModels.Database) => db.rid === database.rid);
          if (isNewDatabase) {
            database.expandDatabase();
          }
          database.refreshTabSelectedState();
        })
      );
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
            databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
            defaultExperience: this.defaultExperience && this.defaultExperience(),
            dataExplorerArea: Constants.Areas.ResourceTree,
            trace: JSON.stringify(error)
          },
          startKey
        );
      }
    );
    return deferred.promise;
  }

  // TODO: Abstract this elsewhere
  private _openShareDialog: () => void = (): void => {
    if (!$("#shareDataAccessFlyout").dialog("instance")) {
      const accountMetadataInfo = {
        databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
        defaultExperience: this.defaultExperience && this.defaultExperience(),
        dataExplorerArea: Constants.Areas.ShareDialog
      };
      const openFullscreenButton = {
        text: "Open",
        class: "openFullScreenBtn openFullScreenCancelBtn",
        click: () => {
          TelemetryProcessor.trace(
            Action.SelectItem,
            ActionModifiers.Mark,
            _.extend({}, { description: "Open full screen" }, accountMetadataInfo)
          );

          const hiddenAnchorElement: HTMLAnchorElement = document.createElement("a");
          hiddenAnchorElement.href = this.shareAccessUrl();
          hiddenAnchorElement.target = "_blank";
          $("#shareDataAccessFlyout").dialog("close");
          hiddenAnchorElement.click();
        }
      };
      const cancelButton = {
        text: "Cancel",
        class: "shareCancelButton openFullScreenCancelBtn",
        click: () => {
          TelemetryProcessor.trace(
            Action.SelectItem,
            ActionModifiers.Mark,
            _.extend({}, { description: "Cancel open full screen" }, accountMetadataInfo)
          );
          $("#shareDataAccessFlyout").dialog("close");
        }
      };
      $("#shareDataAccessFlyout").dialog({
        autoOpen: false,
        buttons: [openFullscreenButton, cancelButton],
        closeOnEscape: true,
        draggable: false,
        dialogClass: "no-close",
        position: { my: "right top", at: "right bottom", of: $(".OpenFullScreen") },
        resizable: false,
        title: "Open Full Screen",
        width: 400,
        close: (event: Event, ui: JQueryUI.DialogUIParams) => this.shouldShowShareDialogContents(false)
      });
      $("#shareDataAccessFlyout").dialog("option", "classes", {
        "ui-widget-content": "shareUrlDialog",
        "ui-widget-header": "shareUrlTitle",
        "ui-dialog-titlebar-close": "shareClose",
        "ui-button": "shareCloseIcon",
        "ui-button-icon": "cancelIcon",
        "ui-icon": ""
      });
      $("#shareDataAccessFlyout").dialog("option", "open", (event: Event, ui: JQueryUI.DialogUIParams) =>
        $(".openFullScreenBtn").focus()
      );
    }
    $("#shareDataAccessFlyout").dialog("close");
    this.shouldShowShareDialogContents(true);
    $("#shareDataAccessFlyout").dialog("open");
  };

  private _getShareAccessUrlForToken(token: string): string {
    if (!token) {
      return undefined;
    }

    const urlPrefixWithKeyParam: string = `${config.hostedExplorerURL}?key=`;
    const currentActiveTab: ViewModels.Tab = this.findActiveTab();

    return `${urlPrefixWithKeyParam}${token}#/${(currentActiveTab && currentActiveTab.hashLocation()) || ""}`;
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    }
  }

  private findSelectedCollectionForSelectedNode(): ViewModels.Collection {
    return this.findCollection(this.selectedNode().rid);
  }

  public findCollection(rid: string): ViewModels.Collection {
    for (let i = 0; i < this.databases().length; i++) {
      const database = this.databases()[i];
      for (let j = 0; j < database.collections().length; j++) {
        const collection = database.collections()[j];
        if (collection.rid === rid) {
          return collection;
        }
      }
    }
    return null;
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
    updatedDatabaseList: DataModels.Database[],
    updatedOffersList: DataModels.Offer[]
  ): { toAdd: ViewModels.Database[]; toDelete: ViewModels.Database[] } {
    const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
      const databaseExists = _.some(
        this.databases(),
        (existingDatabase: ViewModels.Database) => existingDatabase.rid === database._rid
      );
      return !databaseExists;
    });
    const databasesToAdd: ViewModels.Database[] = _.map(newDatabases, (newDatabase: DataModels.Database) => {
      const databaseOffer: DataModels.Offer = this.getOfferForResource(updatedOffersList, newDatabase._self);
      return new Database(this, newDatabase, databaseOffer);
    });

    let databasesToDelete: ViewModels.Database[] = [];
    ko.utils.arrayForEach(this.databases(), (database: ViewModels.Database) => {
      const databasePresentInUpdatedList = _.some(
        updatedDatabaseList,
        (db: DataModels.Database) => db._rid === database.rid
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
      const shouldRemoveDatabase = _.some(databasesToRemove, (db: ViewModels.Database) => db.rid === database.rid);
      if (!shouldRemoveDatabase) {
        databasesToKeep.push(database);
      }
    });

    this.databases(databasesToKeep);
  }

  private findSelectedCollectionForSubNode(): ViewModels.Collection {
    for (let i = 0; i < this.databases().length; i++) {
      const database = this.databases()[i];
      for (let j = 0; j < database.collections().length; j++) {
        const collection = database.collections()[j];
        if (this.selectedNode().collection && collection.rid === this.selectedNode().collection.rid) {
          return collection;
        }
      }
    }
    return null;
  }

  private getOfferForResource(offers: DataModels.Offer[], resourceId: string): DataModels.Offer {
    return _.find(offers, (offer: DataModels.Offer) => offer.resource === resourceId);
  }

  private uploadFile(name: string, content: string, parent: NotebookContentItem): Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to upload notebook, but notebook is not enabled";
      Logger.logError(error, "Explorer/uploadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    const promise = this.notebookContentClient.uploadFileAsync(name, content, parent);
    promise
      .then(() => this.resourceTree.triggerRender())
      .catch(reason => this.showOkModalDialog("Unable to upload file", reason));
    return promise;
  }

  public async importAndOpen(path: string): Promise<boolean> {
    const name = NotebookUtil.getName(path);
    const item = NotebookUtil.createNotebookContentItem(name, path, "file");
    const parent = this.resourceTree.myNotebooksContentRoot;

    if (parent && this.isNotebookEnabled() && this.notebookClient) {
      if (this._filePathToImportAndOpen === path) {
        this._filePathToImportAndOpen = null; // we don't want to try opening this path again
      }

      const existingItem = _.find(parent.children, node => node.name === name);
      if (existingItem) {
        return this.openNotebook(existingItem);
      }

      const content = await this.readFile(item);
      const uploadedItem = await this.uploadFile(name, content, parent);
      return this.openNotebook(uploadedItem);
    }

    this._filePathToImportAndOpen = path; // we'll try opening this path later on
    return Promise.resolve(false);
  }

  public async importAndOpenFromGallery(path: string, newName: string, content: any): Promise<boolean> {
    const name = newName;
    const parent = this.resourceTree.myNotebooksContentRoot;

    if (parent && this.isNotebookEnabled() && this.notebookClient) {
      if (this._filePathToImportAndOpen === path) {
        this._filePathToImportAndOpen = undefined; // we don't want to try opening this path again
      }

      const existingItem = _.find(parent.children, node => node.name === name);
      if (existingItem) {
        this.showOkModalDialog("Download failed", "Notebook with the same name already exists.");
        return Promise.reject(false);
      }

      const uploadedItem = await this.uploadFile(name, content, parent);
      return this.openNotebook(uploadedItem);
    }

    this._filePathToImportAndOpen = path; // we'll try opening this path later on
    return Promise.resolve(false);
  }

  public showOkModalDialog(title: string, msg: string): void {
    this._dialogProps({
      isModal: true,
      visible: true,
      title,
      subText: msg,
      primaryButtonText: "Close",
      secondaryButtonText: undefined,
      onPrimaryButtonClick: this._closeModalDialog,
      onSecondaryButtonClick: undefined
    });
  }

  public showOkCancelModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void
  ): void {
    this._dialogProps({
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
      }
    });
  }

  public showOkCancelTextFieldModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    textFieldProps: TextFieldProps,
    isPrimaryButtonDisabled?: boolean
  ): void {
    let textFieldValue: string = null;
    this._dialogProps({
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
      primaryButtonDisabled: isPrimaryButtonDisabled,
      textFieldProps
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
    const openedNotebookTabs = this.getNotebookTabsForFilepath(notebookContentItem.path);

    if (openedNotebookTabs.length > 0) {
      openedNotebookTabs[0].onTabClick();
      openedNotebookTabs[0].onActivate();
      return true;
    }

    const options: ViewModels.NotebookTabOptions = {
      account: CosmosClient.databaseAccount(),
      tabKind: ViewModels.CollectionTabKind.NotebookV2,
      node: null,
      title: notebookContentItem.name,
      tabPath: notebookContentItem.path,
      documentClientUtility: null,

      collection: null,
      selfLink: null,
      masterKey: CosmosClient.masterKey() || "",
      hashLocation: "notebooks",
      isActive: ko.observable(false),
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
      onUpdateTabsButtons: this.onUpdateTabsButtons,
      container: this,
      notebookContentItem,
      openedTabs: this.openedTabs()
    };

    try {
      const NotebookTabV2 = await import(/* webpackChunkName: "NotebookV2Tab" */ "./Tabs/NotebookV2Tab");
      const notebookTab = new NotebookTabV2.default(options);
      this.openedTabs.push(notebookTab);

      // Activate
      notebookTab.onTabClick();
    } catch (reason) {
      console.error("Import NotebookV2Tab failed!", reason);
      return false;
    }
    return true;
  }

  public renameNotebook(notebookFile: NotebookContentItem): Q.Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to rename notebook, but notebook is not enabled";
      Logger.logError(error, "Explorer/renameNotebook");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) =>
        tab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
        (tab as NotebookTab).notebookPath() === notebookFile.path
    );
    if (openedNotebookTabs.length > 0) {
      this.showOkModalDialog("Unable to rename file", "This file is being edited. Please close the tab and try again.");
      return Q.reject();
    }

    const originalPath = notebookFile.path;
    const result = this.stringInputPane
      .openWithOptions<NotebookContentItem>({
        errorMessage: "Could not rename notebook",
        inProgressMessage: "Renaming notebook to",
        successMessage: "Renamed notebook to",
        inputLabel: "Enter new notebook name",
        paneTitle: "Rename Notebook",
        submitButtonLabel: "Rename",
        defaultInput: FileSystemUtil.stripExtension(notebookFile.name, "ipynb"),
        onSubmit: (input: string) => this.notebookContentClient.renameNotebook(notebookFile, input)
      })
      .then(newNotebookFile => {
        this.openedTabs()
          .filter(
            (tab: ViewModels.Tab) =>
              tab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
              FileSystemUtil.isPathEqual((tab as NotebookTab).notebookPath(), originalPath)
          )
          .forEach(tab => {
            tab.tabTitle(newNotebookFile.name);
            tab.tabPath(newNotebookFile.path);
            (tab as NotebookTab).notebookPath(newNotebookFile.path);
          });

        return newNotebookFile;
      });
    result.then(() => this.resourceTree.triggerRender());
    return result;
  }

  public onCreateDirectory(parent: NotebookContentItem): Q.Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to create notebook directory, but notebook is not enabled";
      Logger.logError(error, "Explorer/onCreateDirectory");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    const result = this.stringInputPane.openWithOptions<NotebookContentItem>({
      errorMessage: "Could not create directory ",
      inProgressMessage: "Creating directory ",
      successMessage: "Created directory ",
      inputLabel: "Enter new directory name",
      paneTitle: "Create new directory",
      submitButtonLabel: "Create",
      defaultInput: "",
      onSubmit: (input: string) => this.notebookContentClient.createDirectory(parent, input)
    });
    result.then(() => this.resourceTree.triggerRender());
    return result;
  }

  public readFile(notebookFile: NotebookContentItem): Promise<string> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to read file, but notebook is not enabled";
      Logger.logError(error, "Explorer/downloadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    return this.notebookContentClient.readFileContent(notebookFile.path);
  }

  public downloadFile(notebookFile: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to download file, but notebook is not enabled";
      Logger.logError(error, "Explorer/downloadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    return this.notebookContentClient.readFileContent(notebookFile.path).then(
      (content: string) => {
        const blob = new Blob([content], { type: "octet/stream" });
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
      },
      error => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Could not download notebook ${JSON.stringify(error)}`
        );
      }
    );
  }

  private async _refreshNotebooksEnabledStateForAccount(): Promise<void> {
    const authType = window.authType as AuthType;
    if (authType === AuthType.EncryptedToken || authType === AuthType.ResourceToken) {
      this.isNotebooksEnabledForAccount(false);
      return;
    }

    const databaseAccount = this.databaseAccount();
    const databaseAccountLocation = databaseAccount && databaseAccount.location.toLowerCase();
    const disallowedLocationsUri = `${this.extensionEndpoint()}/api/disallowedLocations`;
    const authorizationHeader = getAuthorizationHeader();
    try {
      const response = await fetch(disallowedLocationsUri, {
        method: "POST",
        body: JSON.stringify({
          resourceTypes: [Constants.ArmResourceTypes.notebookWorkspaces]
        }),
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [Constants.HttpHeaders.contentType]: "application/json"
        }
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
      const isAccountInAllowedLocation = !disallowedLocations.some(
        disallowedLocation => disallowedLocation === databaseAccountLocation
      );
      this.isNotebooksEnabledForAccount(isAccountInAllowedLocation);
    } catch (error) {
      Logger.logError(error, "Explorer/isNotebooksEnabledForAccount");
      this.isNotebooksEnabledForAccount(false);
    }
  }

  public _refreshSparkEnabledStateForAccount = async (): Promise<void> => {
    const subscriptionId = CosmosClient.subscriptionId();
    const armEndpoint = this.armEndpoint();
    const authType = window.authType as AuthType;
    if (!subscriptionId || !armEndpoint || authType === AuthType.EncryptedToken) {
      // explorer is not aware of the database account yet
      this.isSparkEnabledForAccount(false);
      return;
    }

    const featureUri = `subscriptions/${subscriptionId}/providers/Microsoft.Features/providers/Microsoft.DocumentDb/features/${Constants.AfecFeatures.Spark}`;
    const resourceProviderClient = new ResourceProviderClientFactory(this.armEndpoint()).getOrCreate(featureUri);
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
      Logger.logError(error, "Explorer/isSparkEnabledForAccount");
      this.isSparkEnabledForAccount(false);
    }
  };

  public _isAfecFeatureRegistered = async (featureName: string): Promise<boolean> => {
    const subscriptionId = CosmosClient.subscriptionId();
    const armEndpoint = this.armEndpoint();
    const authType = window.authType as AuthType;
    if (!featureName || !subscriptionId || !armEndpoint || authType === AuthType.EncryptedToken) {
      // explorer is not aware of the database account yet
      return false;
    }

    const featureUri = `subscriptions/${subscriptionId}/providers/Microsoft.Features/providers/Microsoft.DocumentDb/features/${featureName}`;
    const resourceProviderClient = new ResourceProviderClientFactory(this.armEndpoint()).getOrCreate(featureUri);
    try {
      const featureStatus: DataModels.AfecFeature = await resourceProviderClient.getAsync(
        featureUri,
        Constants.ArmApiVersions.armFeatures
      );
      const isEnabled =
        (featureStatus && featureStatus.properties && featureStatus.properties.state === "Registered") || false;
      return isEnabled;
    } catch (error) {
      Logger.logError(error, "Explorer/isSparkEnabledForAccount");
      return false;
    }
  };

  public async openSparkMasterTab() {
    if (!this.sparkClusterConnectionInfo()) {
      await this.initSparkConnectionInfo(this.databaseAccount());
    }

    const openedSparkMasterTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.SparkMasterTab
    );
    if (openedSparkMasterTabs.length > 0) {
      openedSparkMasterTabs[0].onTabClick();
      openedSparkMasterTabs[0].onActivate();
      return;
    }

    const sparkMasterTab = new SparkMasterTab({
      clusterConnectionInfo: this.sparkClusterConnectionInfo(),
      tabKind: ViewModels.CollectionTabKind.SparkMasterTab,
      node: null,
      title: "Apache Spark",
      tabPath: "",
      documentClientUtility: null,

      collection: null,
      selfLink: null,
      hashLocation: "sparkmaster",
      isActive: ko.observable(false),
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
      onUpdateTabsButtons: this.onUpdateTabsButtons,
      openedTabs: this.openedTabs(),
      container: this
    });

    this.openedTabs.push(sparkMasterTab);

    // Activate
    sparkMasterTab.onTabClick();
    return;
  }

  private refreshNotebookList = async (): Promise<void> => {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      return;
    }

    await this.resourceTree.initialize();
    if (this._filePathToImportAndOpen) {
      this.importAndOpen(this._filePathToImportAndOpen);
    }
  };

  public deleteNotebookFile(item: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to delete notebook file, but notebook is not enabled";
      Logger.logError(error, "Explorer/deleteNotebookFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    // Don't delete if tab is open to avoid accidental deletion
    const openedNotebookTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) =>
        tab.tabKind === ViewModels.CollectionTabKind.NotebookV2 && (tab as NotebookTab).notebookPath() === item.path
    );
    if (openedNotebookTabs.length > 0) {
      this.showOkModalDialog("Unable to delete file", "This file is being edited. Please close the tab and try again.");
      return Promise.reject();
    }

    if (item.type === NotebookContentItemType.Directory && item.children && item.children.length > 0) {
      this._dialogProps({
        isModal: true,
        visible: true,
        title: "Unable to delete file",
        subText: "Directory is not empty.",
        primaryButtonText: "Close",
        secondaryButtonText: undefined,
        onPrimaryButtonClick: this._closeModalDialog,
        onSecondaryButtonClick: undefined
      });
      return Promise.reject();
    }

    return this.notebookContentClient.deleteContentItem(item).then(
      () => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully deleted: ${item.path}`);
      },
      reason => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to delete "${item.path}": ${JSON.stringify(reason)}`
        );
      }
    );
  }

  /**
   * This creates a new notebook file, then opens the notebook
   */
  public onNewNotebookClicked(parent?: NotebookContentItem): void {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to create new notebook, but notebook is not enabled";
      Logger.logError(error, "Explorer/onNewNotebookClicked");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    parent = parent || this.resourceTree.myNotebooksContentRoot;

    const notificationProgressId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Creating new notebook in ${parent.path}`
    );

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateNewNotebook, {
      databaseAccountName: this.databaseAccount() && this.databaseAccount().name,
      defaultExperience: this.defaultExperience && this.defaultExperience(),
      dataExplorerArea: Constants.Areas.Notebook
    });

    this.notebookContentClient
      .createNewNotebookFile(parent)
      .then((newFile: NotebookContentItem) => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully created: ${newFile.name}`);
        TelemetryProcessor.traceSuccess(
          Action.CreateNewNotebook,
          {
            databaseAccountName: this.databaseAccount().name,
            defaultExperience: this.defaultExperience(),
            dataExplorerArea: Constants.Areas.Notebook
          },
          startKey
        );
        return this.openNotebook(newFile);
      })
      .then(() => this.resourceTree.triggerRender())
      .catch(reason => {
        const error = `Failed to create a new notebook: ${reason}`;
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
        TelemetryProcessor.traceFailure(
          Action.CreateNewNotebook,
          {
            databaseAccountName: this.databaseAccount().name,
            defaultExperience: this.defaultExperience(),
            dataExplorerArea: Constants.Areas.Notebook,
            error
          },
          startKey
        );
      })
      .finally(() => NotificationConsoleUtils.clearInProgressMessageWithId(notificationProgressId));
  }

  public onUploadToNotebookServerClicked(parent?: NotebookContentItem): void {
    parent = parent || this.resourceTree.myNotebooksContentRoot;

    this.uploadFilePane.openWithOptions({
      paneTitle: "Upload file to notebook server",
      selectFileInputLabel: "Select file to upload",
      errorMessage: "Could not upload file",
      inProgressMessage: "Uploading file to notebook server",
      successMessage: "Successfully uploaded file to notebook server",
      onSubmit: async (file: File): Promise<NotebookContentItem> => {
        const readFileAsText = (inputFile: File): Promise<string> => {
          const reader = new FileReader();
          return new Promise((resolve, reject) => {
            reader.onerror = () => {
              reader.abort();
              reject(`Problem parsing file: ${inputFile}`);
            };
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.readAsText(inputFile);
          });
        };

        const fileContent = await readFileAsText(file);
        return this.uploadFile(file.name, fileContent, parent);
      },
      extensions: undefined,
      submitButtonLabel: "Upload"
    });
  }

  public refreshContentItem(item: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      Logger.logError(error, "Explorer/refreshContentItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      return Promise.reject(new Error(error));
    }

    return this.notebookContentClient.updateItemChildren(item);
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

    const openedTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.Terminal
    );

    for (let i = 0; i < openedTabs.length; ++i) {
      if (openedTabs[i].hashLocation() == hashLocation) {
        openedTabs[i].onTabClick();
        openedTabs[i].onActivate();
        return;
      }
    }

    const newTab = new TerminalTab({
      account: CosmosClient.databaseAccount(),
      tabKind: ViewModels.CollectionTabKind.Terminal,
      node: null,
      title: title,
      tabPath: title,
      documentClientUtility: null,

      collection: null,
      selfLink: null,
      hashLocation: hashLocation,
      isActive: ko.observable(false),
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
      onUpdateTabsButtons: this.onUpdateTabsButtons,
      container: this,
      openedTabs: this.openedTabs(),
      kind: kind
    });

    this.openedTabs.push(newTab);

    // Activate
    newTab.onTabClick();
  }

  public openGallery() {
    let title: string;
    let hashLocation: string;

    title = "Gallery";
    hashLocation = "gallery";

    const openedTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.Gallery
    );

    for (let i = 0; i < openedTabs.length; ++i) {
      if (openedTabs[i].hashLocation() == hashLocation) {
        openedTabs[i].onTabClick();
        openedTabs[i].onActivate();
        return;
      }
    }

    const newTab = new this.galleryTab.default({
      account: CosmosClient.databaseAccount(),
      tabKind: ViewModels.CollectionTabKind.Gallery,
      node: null,
      title: title,
      tabPath: title,
      documentClientUtility: null,
      collection: null,
      selfLink: null,
      hashLocation: hashLocation,
      isActive: ko.observable(false),
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
      onUpdateTabsButtons: this.onUpdateTabsButtons,
      container: this,
      openedTabs: this.openedTabs()
    });

    this.openedTabs.push(newTab);

    // Activate
    newTab.onTabClick();
  }

  public openNotebookViewer(notebookUrl: string, notebookMetadata: DataModels.NotebookMetadata) {
    const notebookName = path.basename(notebookUrl);
    const title = notebookName;
    const hashLocation = notebookUrl;

    const notebookViewerTabModule = this.notebookViewerTab;

    let isNotebookViewerOpen = (tab: ViewModels.Tab) => {
      const notebookViewerTab = tab as typeof notebookViewerTabModule.default;
      return notebookViewerTab.notebookUrl === notebookUrl;
    };

    const openedTabs = this.openedTabs().filter(
      (tab: ViewModels.Tab) => tab.tabKind === ViewModels.CollectionTabKind.NotebookViewer && isNotebookViewerOpen(tab)
    );

    for (let i = 0; i < openedTabs.length; ++i) {
      if (openedTabs[i].hashLocation() == hashLocation) {
        openedTabs[i].onTabClick();
        openedTabs[i].onActivate();
        return;
      }
    }

    const newTab = new this.notebookViewerTab.default({
      account: CosmosClient.databaseAccount(),
      tabKind: ViewModels.CollectionTabKind.NotebookViewer,
      node: null,
      title: title,
      tabPath: title,
      documentClientUtility: null,
      collection: null,
      selfLink: null,
      hashLocation: hashLocation,
      isActive: ko.observable(false),
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: null,
      onUpdateTabsButtons: this.onUpdateTabsButtons,
      container: this,
      openedTabs: this.openedTabs(),
      notebookUrl: notebookUrl,
      notebookName: notebookName,
      notebookMetadata: notebookMetadata
    });

    this.openedTabs.push(newTab);

    // Activate
    newTab.onTabClick();
  }

  public onNewCollectionClicked(): void {
    if (this.isPreferredApiCassandra()) {
      this.cassandraAddCollectionPane.open();
    } else {
      this.addCollectionPane.open(this.selectedDatabaseId());
    }
    document.getElementById("linkAddCollection").focus();
  }

  private getNotebookTabsForFilepath(filepath: string): ViewModels.Tab[] {
    return this.openedTabs().filter(
      (tab: ViewModels.Tab) =>
        tab.tabKind === ViewModels.CollectionTabKind.NotebookV2 &&
        (tab as any).notebookPath &&
        FileSystemUtil.isPathEqual((tab as any).notebookPath(), filepath)
    );
  }

  public closeNotebookTab(filepath: string): void {
    if (!filepath) {
      return;
    }
    this.getNotebookTabsForFilepath(filepath).forEach(tab => tab.onCloseTabButtonClick());
  }

  private refreshCommandBarButtons(): void {
    const activeTab = this.findActiveTab();
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
      Logger.logError(error, "Explorer/getTokenRefreshInterval");
      return tokenRefreshInterval;
    }
  }

  private _setLoadingStatusText(text: string, title: string = "Welcome to Azure Cosmos DB") {
    if (!text) {
      return;
    }

    const loadingText = document.getElementById("explorerLoadingStatusText");
    if (!loadingText) {
      Logger.logError(
        "getElementById('explorerLoadingStatusText') failed to find element",
        "Explorer/_setLoadingStatusText"
      );
      return;
    }
    loadingText.innerHTML = text;

    const loadingTitle = document.getElementById("explorerLoadingStatusTitle");
    if (!loadingTitle) {
      Logger.logError(
        "getElementById('explorerLoadingStatusTitle') failed to find element",
        "Explorer/_setLoadingStatusText"
      );
    } else {
      loadingTitle.innerHTML = title;
    }

    TelemetryProcessor.trace(
      Action.LoadingStatus,
      ActionModifiers.Mark,
      title !== "Welcome to Azure Cosmos DB" ? `Title: ${title}, Text: ${text}` : text
    );
  }

  private _openSetupNotebooksPaneForQuickstart(): void {
    const title = "Enable Notebooks (Preview)";
    const description =
      "You have not yet created a notebooks workspace for this account. To proceed and start using notebooks, we'll need to create a default notebooks workspace in this account.";

    this.setupNotebooksPane.openWithTitleAndDescription(title, description);
  }

  public async handleOpenFileAction(path: string): Promise<void> {
    if (this.isAccountReady() && !(await this._containsDefaultNotebookWorkspace(this.databaseAccount()))) {
      this.closeAllPanes();
      this._openSetupNotebooksPaneForQuickstart();
    }

    this.importAndOpen(path);
  }
}
