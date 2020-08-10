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
import { readDatabases, readCollection, readOffers, refreshCachedResources } from "../Common/DocumentClientUtilityBase";
import EditTableEntityPane from "./Panes/Tables/EditTableEntityPane";
import EnvironmentUtility from "../Common/EnvironmentUtility";
import GraphStylingPane from "./Panes/GraphStylingPane";
import hasher from "hasher";
import NewVertexPane from "./Panes/NewVertexPane";
import NotebookV2Tab, { NotebookTabOptions } from "./Tabs/NotebookV2Tab";
import Q from "q";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import TerminalTab from "./Tabs/TerminalTab";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { ActionContracts, MessageTypes } from "../Contracts/ExplorerContracts";
import { ArcadiaResourceManager } from "../SparkClusterManager/ArcadiaResourceManager";
import { ArcadiaWorkspaceItem } from "./Controls/Arcadia/ArcadiaMenuPicker";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import { BrowseQueriesPane } from "./Panes/BrowseQueriesPane";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import { CommandBarComponentAdapter } from "./Menus/CommandBar/CommandBarComponentAdapter";
import { configContext } from "../ConfigContext";
import { ConsoleData, ConsoleDataType } from "./Menus/NotificationConsole/NotificationConsoleComponent";
import { decryptJWTToken, getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { DialogComponentAdapter } from "./Controls/DialogReactComponent/DialogComponentAdapter";
import { DialogProps, TextFieldProps } from "./Controls/DialogReactComponent/DialogComponent";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane";
import { ExplorerMetrics } from "../Common/Constants";
import { ExplorerSettings } from "../Shared/ExplorerSettings";
import { FileSystemUtil } from "./Notebook/FileSystemUtil";
import { handleOpenAction } from "./OpenActions";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";
import { IGalleryItem } from "../Juno/JunoClient";
import { LoadQueryPane } from "./Panes/LoadQueryPane";
import * as Logger from "../Common/Logger";
import { sendMessage, sendCachedDataMessage, handleCachedDataMessage } from "../Common/MessageHandler";
import { NotebookContentItem, NotebookContentItemType } from "./Notebook/NotebookContentItem";
import { NotebookUtil } from "./Notebook/NotebookUtil";
import { NotebookWorkspaceManager } from "../NotebookWorkspaceManager/NotebookWorkspaceManager";
import { NotificationConsoleComponentAdapter } from "./Menus/NotificationConsole/NotificationConsoleComponentAdapter";
import * as NotificationConsoleUtils from "../Utils/NotificationConsoleUtils";
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
import { SplashScreenComponentAdapter } from "./SplashScreen/SplashScreenComponentApdapter";
import { Splitter, SplitterBounds, SplitterDirection } from "../Common/Splitter";
import { StringInputPane } from "./Panes/StringInputPane";
import { TableColumnOptionsPane } from "./Panes/Tables/TableColumnOptionsPane";
import { TabsManager } from "./Tabs/TabsManager";
import { UploadFilePane } from "./Panes/UploadFilePane";
import { UploadItemsPane } from "./Panes/UploadItemsPane";
import { UploadItemsPaneAdapter } from "./Panes/UploadItemsPaneAdapter";
import { ReactAdapter } from "../Bindings/ReactBindingHandler";
import { toRawContentUri, fromContentUri } from "../Utils/GitHubUtils";
import UserDefinedFunction from "./Tree/UserDefinedFunction";
import StoredProcedure from "./Tree/StoredProcedure";
import Trigger from "./Tree/Trigger";
import { NotificationsClientBase } from "../Common/NotificationsClientBase";
import { ContextualPaneBase } from "./Panes/ContextualPaneBase";
import TabsBase from "./Tabs/TabsBase";
import { CommandButtonComponentProps } from "./Controls/CommandButton/CommandButtonComponent";
import { updateUserContext, userContext } from "../UserContext";

BindingHandlersRegisterer.registerBindingHandlers();
// Hold a reference to ComponentRegisterer to prevent transpiler to ignore import
var tmp = ComponentRegisterer;

enum ShareAccessToggleState {
  ReadWrite,
  Read
}

interface ExplorerOptions {
  notificationsClient: NotificationsClientBase;
  isEmulator: boolean;
}
interface AdHocAccessData {
  readWriteUrl: string;
  readUrl: string;
}

export default class Explorer {
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

  public databaseAccount: ko.Observable<DataModels.DatabaseAccount>;
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
  public isServerlessEnabled: ko.Computed<boolean>;
  public isEmulator: boolean;
  public isAccountReady: ko.Observable<boolean>;
  public canSaveQueries: ko.Computed<boolean>;
  public features: ko.Observable<any>;
  public serverId: ko.Observable<string>;
  public extensionEndpoint: ko.Observable<string>;
  public armEndpoint: ko.Observable<string>;
  public isTryCosmosDBSubscription: ko.Observable<boolean>;
  public notificationsClient: NotificationsClientBase;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;
  public splitter: Splitter;
  public parentFrameDataExplorerVersion: ko.Observable<string> = ko.observable<string>("");
  public mostRecentActivity: MostRecentActivity.MostRecentActivity;

  // Notification Console
  public notificationConsoleData: ko.ObservableArray<ConsoleData>;
  public isNotificationConsoleExpanded: ko.Observable<boolean>;

  // Panes
  public contextPanes: ContextualPaneBase[];

  // Resource Tree
  public databases: ko.ObservableArray<ViewModels.Database>;
  public nonSystemDatabases: ko.Computed<ViewModels.Database[]>;
  public selectedDatabaseId: ko.Computed<string>;
  public selectedCollectionId: ko.Computed<string>;
  public isLeftPaneExpanded: ko.Observable<boolean>;
  public selectedNode: ko.Observable<ViewModels.TreeNode>;
  public isRefreshingExplorer: ko.Observable<boolean>;
  private resourceTree: ResourceTreeAdapter;

  // Resource Token
  public resourceTokenDatabaseId: ko.Observable<string>;
  public resourceTokenCollectionId: ko.Observable<string>;
  public resourceTokenCollection: ko.Observable<ViewModels.CollectionBase>;
  public resourceTokenPartitionKey: ko.Observable<string>;
  public isAuthWithResourceToken: ko.Observable<boolean>;
  public isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;
  private resourceTreeForResourceToken: ResourceTreeAdapterForResourceToken;

  // Tabs
  public isTabsContentExpanded: ko.Observable<boolean>;
  public galleryTab: any;
  public notebookViewerTab: any;
  public tabsManager: TabsManager;

  // Contextual panes
  public addDatabasePane: AddDatabasePane;
  public addCollectionPane: AddCollectionPane;
  public deleteCollectionConfirmationPane: DeleteCollectionConfirmationPane;
  public deleteDatabaseConfirmationPane: DeleteDatabaseConfirmationPane;
  public graphStylingPane: GraphStylingPane;
  public addTableEntityPane: AddTableEntityPane;
  public editTableEntityPane: EditTableEntityPane;
  public tableColumnOptionsPane: TableColumnOptionsPane;
  public querySelectPane: QuerySelectPane;
  public newVertexPane: NewVertexPane;
  public cassandraAddCollectionPane: CassandraAddCollectionPane;
  public settingsPane: SettingsPane;
  public executeSprocParamsPane: ExecuteSprocParamsPane;
  public renewAdHocAccessPane: RenewAdHocAccessPane;
  public uploadItemsPane: UploadItemsPane;
  public uploadItemsPaneAdapter: UploadItemsPaneAdapter;
  public loadQueryPane: LoadQueryPane;
  public saveQueryPane: ContextualPaneBase;
  public browseQueriesPane: BrowseQueriesPane;
  public uploadFilePane: UploadFilePane;
  public stringInputPane: StringInputPane;
  public setupNotebooksPane: SetupNotebooksPane;
  public gitHubReposPane: ContextualPaneBase;
  public publishNotebookPaneAdapter: ReactAdapter;

  // features
  public isGalleryPublishEnabled: ko.Computed<boolean>;
  public isCodeOfConductEnabled: ko.Computed<boolean>;
  public isLinkInjectionEnabled: ko.Computed<boolean>;
  public isGitHubPaneEnabled: ko.Observable<boolean>;
  public isPublishNotebookPaneEnabled: ko.Observable<boolean>;
  public isHostedDataExplorerEnabled: ko.Computed<boolean>;
  public isRightPanelV2Enabled: ko.Computed<boolean>;
  public canExceedMaximumValue: ko.Computed<boolean>;
  public hasAutoPilotV2FeatureFlag: ko.Computed<boolean>;

  public shouldShowShareDialogContents: ko.Observable<boolean>;
  public shareAccessData: ko.Observable<AdHocAccessData>;
  public renewExplorerShareAccess: (explorer: Explorer, token: string) => Q.Promise<void>;
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
  public notebookManager?: any; // This is dynamically loaded

  private _panes: ContextualPaneBase[] = [];
  private _importExplorerConfigComplete: boolean = false;
  private _isSystemDatabasePredicate: (database: ViewModels.Database) => boolean = database => false;
  private _isInitializingNotebooks: boolean;
  private _isInitializingSparkConnectionInfo: boolean;
  private notebookBasePath: ko.Observable<string>;
  private _arcadiaManager: ArcadiaResourceManager;
  private notebookToImport: {
    name: string;
    content: string;
  };

  // React adapters
  private commandBarComponentAdapter: CommandBarComponentAdapter;
  private splashScreenAdapter: SplashScreenComponentAdapter;
  private notificationConsoleComponentAdapter: NotificationConsoleComponentAdapter;
  private dialogComponentAdapter: DialogComponentAdapter;
  private _dialogProps: ko.Observable<DialogProps>;
  private addSynapseLinkDialog: DialogComponentAdapter;
  private _addSynapseLinkDialogProps: ko.Observable<DialogProps>;

  private static readonly MaxNbDatabasesToAutoExpand = 5;

  constructor(options: ExplorerOptions) {
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

    this.databaseAccount = ko.observable<DataModels.DatabaseAccount>();
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
        this.isAuthWithResourceToken() ? this.refreshDatabaseForResourceToken() : this.refreshAllDatabases(true);
        RouteHandler.getInstance().initHandler();
        this.notebookWorkspaceManager = new NotebookWorkspaceManager(this.armEndpoint());
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
            } else if (this.notebookToImport) {
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
    this.notificationsClient = options.notificationsClient;
    this.isEmulator = options.isEmulator;

    this.features = ko.observable();
    this.serverId = ko.observable<string>();
    this.extensionEndpoint = ko.observable<string>(undefined);
    this.armEndpoint = ko.observable<string>(undefined);
    this.queriesClient = new QueriesClient(this);
    this.isTryCosmosDBSubscription = ko.observable<boolean>(false);

    this.resourceTokenDatabaseId = ko.observable<string>();
    this.resourceTokenCollectionId = ko.observable<string>();
    this.resourceTokenCollection = ko.observable<ViewModels.CollectionBase>();
    this.resourceTokenPartitionKey = ko.observable<string>();
    this.isAuthWithResourceToken = ko.observable<boolean>(false);

    this.shareAccessData = ko.observable<AdHocAccessData>({
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
    this.isGalleryPublishEnabled = ko.computed<boolean>(() =>
      this.isFeatureEnabled(Constants.Features.enableGalleryPublish)
    );
    this.isCodeOfConductEnabled = ko.computed<boolean>(() =>
      this.isFeatureEnabled(Constants.Features.enableCodeOfConduct)
    );
    this.isLinkInjectionEnabled = ko.computed<boolean>(() =>
      this.isFeatureEnabled(Constants.Features.enableLinkInjection)
    );
    this.isGitHubPaneEnabled = ko.observable<boolean>(false);
    this.isPublishNotebookPaneEnabled = ko.observable<boolean>(false);

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
    this.databaseAccount.subscribe(databaseAccount => {
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

    this.isServerlessEnabled = ko.computed(
      () =>
        this.databaseAccount &&
        this.databaseAccount()?.properties?.capabilities?.find(
          item => item.name === Constants.CapabilityNames.EnableServerless
        ) !== undefined
    );

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
    this.isRightPanelV2Enabled = ko.computed<boolean>(() =>
      this.isFeatureEnabled(Constants.Features.enableRightPanelV2)
    );
    this.defaultExperience.subscribe((defaultExperience: string) => {
      if (
        defaultExperience &&
        defaultExperience.toLowerCase() === Constants.DefaultAccountExperience.Cassandra.toLowerCase()
      ) {
        this._isSystemDatabasePredicate = (database: ViewModels.Database): boolean => {
          return database.id() === "system";
        };
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
      id: "adddatabasepane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.addCollectionPane = new AddCollectionPane({
      isPreferredApiTable: ko.computed(() => this.isPreferredApiTable()),
      id: "addcollectionpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.deleteCollectionConfirmationPane = new DeleteCollectionConfirmationPane({
      id: "deletecollectionconfirmationpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.deleteDatabaseConfirmationPane = new DeleteDatabaseConfirmationPane({
      id: "deletedatabaseconfirmationpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.graphStylingPane = new GraphStylingPane({
      id: "graphstylingpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.addTableEntityPane = new AddTableEntityPane({
      id: "addtableentitypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.editTableEntityPane = new EditTableEntityPane({
      id: "edittableentitypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.tableColumnOptionsPane = new TableColumnOptionsPane({
      id: "tablecolumnoptionspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.querySelectPane = new QuerySelectPane({
      id: "queryselectpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.newVertexPane = new NewVertexPane({
      id: "newvertexpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.cassandraAddCollectionPane = new CassandraAddCollectionPane({
      id: "cassandraaddcollectionpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.settingsPane = new SettingsPane({
      id: "settingspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.executeSprocParamsPane = new ExecuteSprocParamsPane({
      id: "executesprocparamspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.renewAdHocAccessPane = new RenewAdHocAccessPane({
      id: "renewadhocaccesspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.uploadItemsPane = new UploadItemsPane({
      id: "uploaditemspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.uploadItemsPaneAdapter = new UploadItemsPaneAdapter(this);

    this.loadQueryPane = new LoadQueryPane({
      id: "loadquerypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.saveQueryPane = new SaveQueryPane({
      id: "savequerypane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.browseQueriesPane = new BrowseQueriesPane({
      id: "browsequeriespane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.uploadFilePane = new UploadFilePane({
      id: "uploadfilepane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.stringInputPane = new StringInputPane({
      id: "stringinputpane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.setupNotebooksPane = new SetupNotebooksPane({
      id: "setupnotebookspane",
      visible: ko.observable<boolean>(false),

      container: this
    });

    this.tabsManager = new TabsManager();

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
      this.setupNotebooksPane
    ];
    this.addDatabaseText.subscribe((addDatabaseText: string) => this.addDatabasePane.title(addDatabaseText));
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
          this.tableDataClient = new TablesAPIDataClient();
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
          this.tableDataClient = new CassandraAPIDataClient();
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

    this.isNotebookEnabled = ko.observable(false);
    this.isNotebookEnabled.subscribe(async () => {
      if (!this.notebookManager) {
        const notebookManagerModule = await import(
          /* webpackChunkName: "NotebookManager" */ "./Notebook/NotebookManager"
        );
        this.notebookManager = new notebookManagerModule.default();
        this.notebookManager.initialize({
          container: this,
          dialogProps: this._dialogProps,
          notebookBasePath: this.notebookBasePath,
          resourceTree: this.resourceTree,
          refreshCommandBarButtons: () => this.refreshCommandBarButtons(),
          refreshNotebookList: () => this.refreshNotebookList()
        });

        this.gitHubReposPane = this.notebookManager.gitHubReposPane;
        this.isGitHubPaneEnabled(true);
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
          const databaseAccount: DataModels.DatabaseAccount = await resourceProviderClient.patchAsync(
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
        this.tabsManager.closeTabs(); // clear all tabs so we dont leave any tabs from previous session open
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
    readCollection(databaseId, collectionId).then((collection: DataModels.Collection) => {
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

    const refreshDatabases = (offers?: DataModels.Offer[]) => {
      this._setLoadingStatusText("Fetching databases...");
      readDatabases(null /*options*/).then(
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
    };

    if (this.isServerlessEnabled()) {
      // Serverless accounts don't support offers call
      refreshDatabases();
    } else {
      const offerPromise: Q.Promise<DataModels.Offer[]> = readOffers();
      this._setLoadingStatusText("Fetching offers...");
      offerPromise.then(
        (offers: DataModels.Offer[]) => {
          this._setLoadingStatusText("Successfully fetched offers.");
          refreshDatabases(offers);
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
    }

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
    refreshCachedResources().then(
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

  public async getArcadiaToken(): Promise<string> {
    return new Promise<string>((resolve: (token: string) => void, reject: (error: any) => void) => {
      sendCachedDataMessage<string>(MessageTypes.GetArcadiaToken, undefined /** params **/).then(
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
      const workspaces = await this._arcadiaManager.listWorkspacesAsync([userContext.subscriptionId]);
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookClient) {
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
      const workspaces = await this.notebookWorkspaceManager.getNotebookWorkspacesAsync(databaseAccount?.id);
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

  private _resetNotebookWorkspace = async () => {
    this._closeModalDialog();
    const id = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, "Resetting notebook workspace");
    try {
      await this.notebookManager?.notebookClient.resetWorkspace();
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
    if (inputs && configContext.BACKEND_ENDPOINT && isRunningInPortal && isRunningInDevMode) {
      inputs.extensionEndpoint = configContext.PROXY_PATH;
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
        handleCachedDataMessage(message);
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
      this.armEndpoint(EnvironmentUtility.normalizeArmEndpointUri(inputs.csmEndpoint || configContext.ARM_ENDPOINT));
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

      updateUserContext({
        authorizationToken,
        masterKey,
        databaseAccount
      });
      updateUserContext({ resourceGroup: inputs.resourceGroup, subscriptionId: inputs.subscriptionId });
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

  public findSelectedCollection(): ViewModels.Collection {
    if (this.selectedNode().nodeKind === "Collection") {
      return this.findSelectedCollectionForSelectedNode();
    } else {
      return this.findSelectedCollectionForSubNode();
    }
  }

  // TODO: Refactor below methods, minimize dependencies and add unit tests where necessary
  public findSelectedStoredProcedure(): StoredProcedure {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.storedProcedures(), (storedProcedure: StoredProcedure) => {
      const openedSprocTab = this.tabsManager.getTabs(
        ViewModels.CollectionTabKind.StoredProcedures,
        tab => tab.node && tab.node.rid === storedProcedure.rid
      );
      return (
        storedProcedure.rid === this.selectedNode().rid ||
        (!!openedSprocTab && openedSprocTab.length > 0 && openedSprocTab[0].isActive())
      );
    });
  }

  public findSelectedUDF(): UserDefinedFunction {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.userDefinedFunctions(), (userDefinedFunction: UserDefinedFunction) => {
      const openedUdfTab = this.tabsManager.getTabs(
        ViewModels.CollectionTabKind.UserDefinedFunctions,
        tab => tab.node && tab.node.rid === userDefinedFunction.rid
      );
      return (
        userDefinedFunction.rid === this.selectedNode().rid ||
        (!!openedUdfTab && openedUdfTab.length > 0 && openedUdfTab[0].isActive())
      );
    });
  }

  public findSelectedTrigger(): Trigger {
    const selectedCollection: ViewModels.Collection = this.findSelectedCollection();
    return _.find(selectedCollection.triggers(), (trigger: Trigger) => {
      const openedTriggerTab = this.tabsManager.getTabs(
        ViewModels.CollectionTabKind.Triggers,
        tab => tab.node && tab.node.rid === trigger.rid
      );
      return (
        trigger.rid === this.selectedNode().rid ||
        (!!openedTriggerTab && openedTriggerTab.length > 0 && openedTriggerTab[0].isActive())
      );
    });
  }

  public closeAllPanes(): void {
    this._panes.forEach((pane: ContextualPaneBase) => pane.close());
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

  public onUpdateTabsButtons(buttons: CommandButtonComponentProps[]): void {
    this.commandBarComponentAdapter.onUpdateTabsButtons(buttons);
  }

  public signInAad = () => {
    TelemetryProcessor.trace(Action.SignInAad, undefined, { area: "Explorer" });
    sendMessage({
      type: MessageTypes.AadSignIn
    });
  };

  public onSwitchToConnectionString = () => {
    $("#connectWithAad").hide();
    $("#connectWithConnectionString").show();
  };

  public clickHostedAccountSwitch = () => {
    sendMessage({
      type: MessageTypes.UpdateAccountSwitch,
      click: true
    });
  };

  public clickHostedDirectorySwitch = () => {
    sendMessage({
      type: MessageTypes.UpdateDirectoryControl,
      click: true
    });
  };

  public refreshDatabaseAccount = () => {
    sendMessage({
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
          this.tabsManager.refreshActiveTab(tab => tab.collection && tab.collection.getDatabase().rid === database.rid);
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

    const urlPrefixWithKeyParam: string = `${configContext.hostedExplorerURL}?key=`;
    const currentActiveTab = this.tabsManager.activeTab();

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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to upload notebook, but notebook is not enabled";
      Logger.logError(error, "Explorer/uploadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
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
      const existingItem = _.find(parent.children, node => node.name === name);
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

      const existingItem = _.find(parent.children, node => node.name === name);
      if (existingItem) {
        return this.openNotebook(existingItem);
      }

      const uploadedItem = await this.uploadFile(name, content, parent);
      return this.openNotebook(uploadedItem);
    }

    this.notebookToImport = { name, content }; // we'll try opening this notebook later on
    return Promise.resolve(false);
  }

  public async publishNotebook(name: string, content: string | unknown, parentDomElement: HTMLElement): Promise<void> {
    if (this.notebookManager) {
      await this.notebookManager.openPublishNotebookPane(
        name,
        content,
        parentDomElement,
        this.isCodeOfConductEnabled(),
        this.isLinkInjectionEnabled()
      );
      this.publishNotebookPaneAdapter = this.notebookManager.publishNotebookPaneAdapter;
      this.isPublishNotebookPaneEnabled(true);
    }
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

    const notebookTabs = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.NotebookV2,
      tab =>
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
        selfLink: null,
        masterKey: userContext.masterKey || "",
        hashLocation: "notebooks",
        isActive: ko.observable(false),
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null,
        onUpdateTabsButtons: this.onUpdateTabsButtons,
        container: this,
        notebookContentItem
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

  public renameNotebook(notebookFile: NotebookContentItem): Q.Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to rename notebook, but notebook is not enabled";
      Logger.logError(error, "Explorer/renameNotebook");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
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
        onSubmit: (input: string) => this.notebookManager?.notebookContentClient.renameNotebook(notebookFile, input)
      })
      .then(newNotebookFile => {
        const notebookTabs = this.tabsManager.getTabs(
          ViewModels.CollectionTabKind.NotebookV2,
          (tab: NotebookV2Tab) => tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), originalPath)
        );
        notebookTabs.forEach(tab => {
          tab.tabTitle(newNotebookFile.name);
          tab.tabPath(newNotebookFile.path);
          (tab as NotebookV2Tab).notebookPath(newNotebookFile.path);
        });

        return newNotebookFile;
      });
    result.then(() => this.resourceTree.triggerRender());
    return result;
  }

  public onCreateDirectory(parent: NotebookContentItem): Q.Promise<NotebookContentItem> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
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
      onSubmit: (input: string) => this.notebookManager?.notebookContentClient.createDirectory(parent, input)
    });
    result.then(() => this.resourceTree.triggerRender());
    return result;
  }

  public readFile(notebookFile: NotebookContentItem): Promise<string> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to read file, but notebook is not enabled";
      Logger.logError(error, "Explorer/downloadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    return this.notebookManager?.notebookContentClient.readFileContent(notebookFile.path);
  }

  public downloadFile(notebookFile: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to download file, but notebook is not enabled";
      Logger.logError(error, "Explorer/downloadFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
      throw new Error(error);
    }

    return this.notebookManager?.notebookContentClient.readFileContent(notebookFile.path).then(
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
      (error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Could not download notebook ${JSON.stringify(error)}`
        );
      }
    );
  }

  private async _refreshNotebooksEnabledStateForAccount(): Promise<void> {
    const authType = window.authType as AuthType;
    if (
      authType === AuthType.EncryptedToken ||
      authType === AuthType.ResourceToken ||
      authType === AuthType.MasterKey
    ) {
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
    const subscriptionId = userContext.subscriptionId;
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
    const subscriptionId = userContext.subscriptionId;
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
  private refreshNotebookList = async (): Promise<void> => {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      return;
    }

    await this.resourceTree.initialize();
    if (this.notebookToImport) {
      this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
    }
  };

  public deleteNotebookFile(item: NotebookContentItem): Promise<void> {
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to delete notebook file, but notebook is not enabled";
      Logger.logError(error, "Explorer/deleteNotebookFile");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
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

    return this.notebookManager?.notebookContentClient.deleteContentItem(item).then(
      () => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully deleted: ${item.path}`);
      },
      (reason: any) => {
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
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

    this.notebookManager?.notebookContentClient
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
      .catch((reason: any) => {
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
    if (!this.isNotebookEnabled() || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      Logger.logError(error, "Explorer/refreshContentItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, error);
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
      tab => tab.hashLocation() == hashLocation
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
        selfLink: null,
        hashLocation: hashLocation,
        isActive: ko.observable(false),
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null,
        onUpdateTabsButtons: this.onUpdateTabsButtons,
        container: this,
        kind: kind
      });

      this.tabsManager.activateNewTab(newTab);
    }
  }

  public async openGallery(notebookUrl?: string, galleryItem?: IGalleryItem, isFavorite?: boolean) {
    let title: string = "Gallery";
    let hashLocation: string = "gallery";

    const galleryTabs = this.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Gallery,
      tab => tab.hashLocation() == hashLocation
    );
    let galleryTab = galleryTabs && galleryTabs[0];

    if (galleryTab) {
      this.tabsManager.activateTab(galleryTab);
    } else {
      if (!this.galleryTab) {
        this.galleryTab = await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab");
      }

      const newTab = new this.galleryTab.default({
        // GalleryTabOptions
        account: userContext.databaseAccount,
        container: this,
        junoClient: this.notebookManager?.junoClient,
        notebookUrl,
        galleryItem,
        isFavorite,
        // TabOptions
        tabKind: ViewModels.CollectionTabKind.Gallery,
        title: title,
        tabPath: title,
        documentClientUtility: null,
        selfLink: null,
        isActive: ko.observable(false),
        hashLocation: hashLocation,
        onUpdateTabsButtons: this.onUpdateTabsButtons,
        isTabsContentExpanded: ko.observable(true),
        onLoadStartKey: null
      });

      this.tabsManager.activateNewTab(newTab);
    }
  }

  public async openNotebookViewer(notebookUrl: string) {
    const title = path.basename(notebookUrl);
    const hashLocation = notebookUrl;

    if (!this.notebookViewerTab) {
      this.notebookViewerTab = await import(/* webpackChunkName: "NotebookViewerTab" */ "./Tabs/NotebookViewerTab");
    }

    const notebookViewerTabModule = this.notebookViewerTab;

    let isNotebookViewerOpen = (tab: TabsBase) => {
      const notebookViewerTab = tab as typeof notebookViewerTabModule.default;
      return notebookViewerTab.notebookUrl === notebookUrl;
    };

    const notebookViewerTabs = this.tabsManager.getTabs(ViewModels.CollectionTabKind.NotebookV2, tab => {
      return tab.hashLocation() == hashLocation && isNotebookViewerOpen(tab);
    });
    let notebookViewerTab = notebookViewerTabs && notebookViewerTabs[0];

    if (notebookViewerTab) {
      this.tabsManager.activateNewTab(notebookViewerTab);
    } else {
      notebookViewerTab = new this.notebookViewerTab.default({
        account: userContext.databaseAccount,
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
        notebookUrl
      });

      this.tabsManager.activateNewTab(notebookViewerTab);
    }
  }

  public onNewCollectionClicked(): void {
    if (this.isPreferredApiCassandra()) {
      this.cassandraAddCollectionPane.open();
    } else {
      this.addCollectionPane.open(this.selectedDatabaseId());
    }
    document.getElementById("linkAddCollection").focus();
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
          content: await response.text()
        };

        this.importAndOpenContent(this.notebookToImport.name, this.notebookToImport.content);
      }
    }
  }
}
