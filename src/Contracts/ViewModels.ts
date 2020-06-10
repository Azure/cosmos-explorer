import * as DataModels from "./DataModels";
import * as Entities from "../Explorer/Tables/Entities";
import * as monaco from "monaco-editor";
import DocumentClientUtilityBase from "../Common/DocumentClientUtilityBase";
import Q from "q";
import QueryViewModel from "../Explorer/Tables/QueryBuilder/QueryViewModel";
import TableEntityListViewModel from "../Explorer/Tables/DataTable/TableEntityListViewModel";
import { AccessibleVerticalList } from "../Explorer/Tree/AccessibleVerticalList";
import { ArcadiaWorkspaceItem } from "../Explorer/Controls/Arcadia/ArcadiaMenuPicker";
import { CassandraTableKey, CassandraTableKeys, TableDataClient } from "../Explorer/Tables/TableDataClient";
import { CommandButtonComponentProps } from "../Explorer/Controls/CommandButton/CommandButtonComponent";
import { CommandButtonOptions } from "../Explorer/Controls/CommandButton/CommandButton";
import { ConsoleData } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { ExecuteSprocParam } from "../Explorer/Panes/ExecuteSprocParamsPane";
import { GitHubClient } from "../GitHub/GitHubClient";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { IColumnSetting } from "../Explorer/Panes/Tables/TableColumnOptionsPane";
import { IContentProvider } from "@nteract/core";
import { JunoClient } from "../Juno/JunoClient";
import { Library } from "./DataModels";
import { MostRecentActivity } from "../Explorer/MostRecentActivity/MostRecentActivity";
import { NotebookContentItem } from "../Explorer/Notebook/NotebookContentItem";
import { PlatformType } from "../PlatformType";
import { QueryMetrics } from "@azure/cosmos";
import { SetupNotebooksPane } from "../Explorer/Panes/SetupNotebooksPane";
import { Splitter } from "../Common/Splitter";
import { StringInputPane } from "../Explorer/Panes/StringInputPane";
import { TextFieldProps } from "../Explorer/Controls/DialogReactComponent/DialogComponent";
import { UploadDetails } from "../workers/upload/definitions";
import { UploadItemsPaneAdapter } from "../Explorer/Panes/UploadItemsPaneAdapter";

export interface ExplorerOptions {
  documentClientUtility: DocumentClientUtilityBase;
  notificationsClient: NotificationsClient;
  isEmulator: boolean;
}

export interface Capability extends DataModels.Capability {}

export interface ConfigurationOverrides extends DataModels.ConfigurationOverrides {}

export interface NavbarButtonConfig extends CommandButtonComponentProps {}

export interface DatabaseAccount extends DataModels.DatabaseAccount {}

export interface Explorer {
  flight: ko.Observable<string>;
  handleMessage(event: MessageEvent): void;
  isRefreshingExplorer: ko.Observable<boolean>;

  databaseAccount: ko.Observable<DatabaseAccount>;
  subscriptionType: ko.Observable<SubscriptionType>;
  quotaId: ko.Observable<string>;
  hasWriteAccess: ko.Observable<boolean>;

  defaultExperience: ko.Observable<string>;
  isPreferredApiDocumentDB: ko.Computed<boolean>;
  isPreferredApiCassandra: ko.Computed<boolean>;
  isPreferredApiTable: ko.Computed<boolean>;
  isPreferredApiGraph: ko.Computed<boolean>;
  isPreferredApiMongoDB: ko.Computed<boolean>;

  isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;

  isDatabaseNodeOrNoneSelected(): boolean;
  isDatabaseNodeSelected(): boolean;
  isNodeKindSelected(nodeKind: string): boolean;
  isNoneSelected(): boolean;
  isSelectedDatabaseShared(): boolean;
  deleteDatabaseText: ko.Observable<string>;
  deleteCollectionText: ko.Subscribable<string>; // Our code assigns to a ko.Observable, but unit test assigns to ko.Computed

  addCollectionText: ko.Observable<string>;
  addDatabaseText: ko.Observable<string>;
  collectionTitle: ko.Observable<string>;
  collectionTreeNodeAltText: ko.Observable<string>;
  refreshTreeTitle: ko.Observable<string>;

  isAccountReady: ko.Observable<boolean>;

  collectionCreationDefaults: CollectionCreationDefaults;
  isEmulator: boolean;
  features: ko.Observable<any>;
  serverId: ko.Observable<string>;
  extensionEndpoint: ko.Observable<string>;
  armEndpoint: ko.Observable<string>;
  isFeatureEnabled: (feature: string) => boolean;
  isGalleryEnabled: ko.Computed<boolean>;
  isGitHubPaneEnabled: ko.Observable<boolean>;
  isGraphsEnabled: ko.Computed<boolean>;
  isRightPanelV2Enabled: ko.Computed<boolean>;
  canExceedMaximumValue: ko.Computed<boolean>;
  hasAutoPilotV2FeatureFlag: ko.Computed<boolean>;
  isHostedDataExplorerEnabled: ko.Computed<boolean>;
  isNotificationConsoleExpanded: ko.Observable<boolean>;
  isTryCosmosDBSubscription: ko.Observable<boolean>;
  canSaveQueries: ko.Computed<boolean>;
  parentFrameDataExplorerVersion: ko.Observable<string>;

  documentClientUtility: DocumentClientUtilityBase;
  notificationsClient: NotificationsClient;
  queriesClient: QueriesClient;
  tableDataClient: TableDataClient;
  splitter: Splitter;
  notificationConsoleData: ko.ObservableArray<ConsoleData>;

  // Selection
  selectedNode: ko.Observable<TreeNode>;

  // Tree
  databases: ko.ObservableArray<Database>;
  nonSystemDatabases: ko.Computed<Database[]>;
  selectedDatabaseId: ko.Computed<string>;
  selectedCollectionId: ko.Computed<string>;
  isLeftPaneExpanded: ko.Observable<boolean>;

  // Resource Token
  resourceTokenDatabaseId: ko.Observable<string>;
  resourceTokenCollectionId: ko.Observable<string>;
  resourceTokenCollection: ko.Observable<CollectionBase>;
  resourceTokenPartitionKey: ko.Observable<string>;
  isAuthWithResourceToken: ko.Observable<boolean>;
  isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;

  // Tabs
  openedTabs: ko.ObservableArray<Tab>;
  activeTab: ko.Observable<Tab>;
  isTabsContentExpanded: ko.Observable<boolean>;

  // Contextual Panes
  addDatabasePane: AddDatabasePane;
  addCollectionPane: AddCollectionPane;
  deleteCollectionConfirmationPane: DeleteCollectionConfirmationPane;
  deleteDatabaseConfirmationPane: DeleteDatabaseConfirmationPane;
  graphStylingPane: GraphStylingPane;
  addTableEntityPane: AddTableEntityPane;
  editTableEntityPane: EditTableEntityPane;
  tableColumnOptionsPane: TableColumnOptionsPane;
  querySelectPane: QuerySelectPane;
  newVertexPane: NewVertexPane;
  cassandraAddCollectionPane: CassandraAddCollectionPane;
  settingsPane: SettingsPane;
  executeSprocParamsPane: ExecuteSprocParamsPane;
  renewAdHocAccessPane: RenewAdHocAccessPane;
  uploadItemsPane: UploadItemsPane;
  uploadItemsPaneAdapter: UploadItemsPaneAdapter;
  loadQueryPane: LoadQueryPane;
  saveQueryPane: ContextualPane;
  browseQueriesPane: BrowseQueriesPane;
  uploadFilePane: UploadFilePane;
  stringInputPane: StringInputPane;
  setupNotebooksPane: SetupNotebooksPane;
  setupSparkClusterPane: ContextualPane;
  manageSparkClusterPane: ContextualPane;
  libraryManagePane: ContextualPane;
  clusterLibraryPane: ContextualPane;
  gitHubReposPane: ContextualPane;

  // Facade
  logConsoleData(data: ConsoleData): void;
  isNodeKindSelected(nodeKind: string): boolean;
  initDataExplorerWithFrameInputs(inputs: DataExplorerInputsFrame): Q.Promise<void>;
  toggleLeftPaneExpanded(): void;
  refreshDatabaseForResourceToken(): Q.Promise<void>;
  refreshAllDatabases(isInitialLoad?: boolean): Q.Promise<any>;
  closeAllPanes(): void;
  closeAllTabsForResource(resourceId: string): void;
  findActiveTab(): Tab; // TODO Deprecate in favor activeTab
  findSelectedDatabase(): Database;
  findDatabaseWithId(databaseRid: string): Database;
  isLastDatabase(): boolean;
  isLastNonEmptyDatabase(): boolean;
  findSelectedCollection(): Collection;
  isLastCollection(): boolean;
  findSelectedStoredProcedure(): StoredProcedure;
  findSelectedUDF(): UserDefinedFunction;
  findSelectedTrigger(): Trigger;
  findCollection(rid: string): Collection;
  provideFeedbackEmail(): void;
  expandConsole: () => void;
  collapseConsole: () => void;
  generateSharedAccessData(): void;
  getPlatformType(): PlatformType;
  isConnectExplorerVisible(): boolean;
  isRunningOnNationalCloud(): boolean;
  displayConnectExplorerForm(): void;
  hideConnectExplorerForm(): void;
  displayContextSwitchPromptForConnectionString(connectionString: string): void;
  displayGuestAccessTokenRenewalPrompt(): void;
  rebindDocumentClientUtility(documentClientUtility: DocumentClientUtilityBase): void;
  renewExplorerShareAccess: (explorer: Explorer, token: string) => Q.Promise<void>;
  renewShareAccess(accessInput: string): Q.Promise<void>;
  onUpdateTabsButtons: (buttons: NavbarButtonConfig[]) => void;
  onNewCollectionClicked: () => void;
  showOkModalDialog: (title: string, msg: string) => void;
  showOkCancelModalDialog: (
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void
  ) => void;
  showOkCancelTextFieldModalDialog: (
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    textFiledProps: TextFieldProps,
    isPrimaryButtonDisabled?: boolean
  ) => void;

  // Analytics
  isNotebookEnabled: ko.Observable<boolean>;
  isSparkEnabled: ko.Observable<boolean>;
  isNotebooksEnabledForAccount: ko.Observable<boolean>;
  isSparkEnabledForAccount: ko.Observable<boolean>;
  hasStorageAnalyticsAfecFeature: ko.Observable<boolean>;
  openEnableSynapseLinkDialog(): void;
  isSynapseLinkUpdating: ko.Observable<boolean>;
  notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>;
  sparkClusterConnectionInfo: ko.Observable<DataModels.SparkClusterConnectionInfo>;
  arcadiaToken: ko.Observable<string>;
  arcadiaWorkspaces: ko.ObservableArray<ArcadiaWorkspaceItem>;
  isNotebookTabActive: ko.Computed<boolean>;
  memoryUsageInfo: ko.Observable<DataModels.MemoryUsageInfo>;
  openNotebook(notebookContentItem: NotebookContentItem): Promise<boolean>; // True if it was opened, false otherwise
  resetNotebookWorkspace(): void;
  importAndOpen: (path: string) => Promise<boolean>;
  importAndOpenFromGallery: (path: string, newName: string, content: any) => Promise<boolean>;
  openNotebookTerminal: (kind: TerminalKind) => void;
  openGallery: () => void;
  openNotebookViewer: (
    notebookUrl: string,
    notebookMetadata: DataModels.NotebookMetadata,
    onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
    isLikedNotebook: boolean
  ) => void;
  notebookWorkspaceManager: NotebookWorkspaceManager;
  sparkClusterManager: SparkClusterManager;
  notebookContentProvider: IContentProvider;
  gitHubOAuthService: GitHubOAuthService;
  mostRecentActivity: MostRecentActivity;
  initNotebooks: (databaseAccount: DataModels.DatabaseAccount) => Promise<void>;
  deleteCluster(): void;
  openSparkMasterTab(): Promise<void>;
  handleOpenFileAction(path: string): Promise<void>;

  // Notebook operations
  openNotebook(notebookContentItem: NotebookContentItem): Promise<boolean>; // True if it was opened, false otherwise
  deleteNotebookFile: (item: NotebookContentItem) => Promise<void>;
  onCreateDirectory(parent: NotebookContentItem): Q.Promise<NotebookContentItem>;
  onNewNotebookClicked: (parent?: NotebookContentItem) => void;
  onUploadToNotebookServerClicked: (parent?: NotebookContentItem) => void;
  renameNotebook: (notebookFile: NotebookContentItem) => Q.Promise<NotebookContentItem>;
  readFile: (notebookFile: NotebookContentItem) => Promise<string>;
  downloadFile: (notebookFile: NotebookContentItem) => Promise<void>;
  createNotebookContentItemFile: (name: string, filepath: string) => NotebookContentItem;
  closeNotebookTab: (filepath: string) => void;
  refreshContentItem(item: NotebookContentItem): Promise<void>;
  getNotebookBasePath(): string;

  createWorkspace(): Promise<string>;
  createSparkPool(workspaceId: string): Promise<string>;
}

export interface NotebookWorkspaceManager {
  getNotebookWorkspacesAsync(cosmosAccountResourceId: string): Promise<DataModels.NotebookWorkspace[]>;
  getNotebookWorkspaceAsync(
    cosmosAccountResourceId: string,
    notebookWorkspaceId: string
  ): Promise<DataModels.NotebookWorkspace>;
  createNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void>;
  deleteNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void>;
  getNotebookConnectionInfoAsync(
    cosmosAccountResourceId: string,
    notebookWorkspaceId: string
  ): Promise<DataModels.NotebookWorkspaceConnectionInfo>;
  startNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void>;
}

export interface KernelConnectionMetadata {
  name: string;
  configurationEndpoints: DataModels.NotebookConfigurationEndpoints;
  notebookConnectionInfo: DataModels.NotebookWorkspaceConnectionInfo;
}

export interface SparkClusterManager {
  getClustersAsync(cosmosAccountResourceId: string): Promise<DataModels.SparkCluster[]>;
  getClusterAsync(cosmosAccountResourceId: string, clusterId: string): Promise<DataModels.SparkCluster>;
  createClusterAsync(cosmosAccountResourceId: string, cluster: Partial<DataModels.SparkCluster>): Promise<void>;
  updateClusterAsync(
    cosmosAccountResourceId: string,
    clusterId: string,
    sparkCluster: DataModels.SparkCluster
  ): Promise<DataModels.SparkCluster>;
  deleteClusterAsync(cosmosAccountResourceId: string, clusterId: string): Promise<void>;
  getClusterConnectionInfoAsync(
    cosmosAccountResourceId: string,
    clusterId: string
  ): Promise<DataModels.SparkClusterConnectionInfo>;
  getLibrariesAsync(cosmosdbResourceId: string): Promise<Library[]>;
  getLibraryAsync(cosmosdbResourceId: string, libraryName: string): Promise<Library>;
  addLibraryAsync(cosmosdbResourceId: string, libraryName: string, library: Library): Promise<void>;
  deleteLibraryAsync(cosmosdbResourceId: string, libraryName: string): Promise<void>;
}

export interface ArcadiaResourceManager {
  getWorkspacesAsync(arcadiaResourceId: string): Promise<DataModels.ArcadiaWorkspace[]>;
  getWorkspaceAsync(arcadiaResourceId: string, workspaceId: string): Promise<DataModels.ArcadiaWorkspace>;
  listWorkspacesAsync(subscriptionIds: string[]): Promise<DataModels.ArcadiaWorkspace[]>;
  listSparkPoolsAsync(resourceId: string): Promise<DataModels.SparkPool[]>;
}

export interface TokenProvider {
  getAuthHeader(): Promise<Headers>;
}

export interface QueryResultsMetadata {
  hasMoreResults: boolean;
  firstItemIndex: number;
  lastItemIndex: number;
  itemCount: number;
}

export interface QueryResults extends QueryResultsMetadata {
  documents: any[];
  activityId: string;
  requestCharge: number;
  roundTrips?: number;
  headers?: any;
  queryMetrics?: QueryMetrics;
}

export interface Button {
  visible: ko.Computed<boolean>;
  enabled: ko.Computed<boolean>;
  isSelected?: ko.Computed<boolean>;
}

export interface CommandButton {
  disabled: ko.Subscribable<boolean>;
  visible: ko.Subscribable<boolean>;
  iconSrc: string;
  commandButtonLabel: string | ko.Observable<string>;
  tooltipText: string | ko.Observable<string>;
  children: ko.ObservableArray<CommandButtonOptions>;

  commandClickCallback: () => void;
}

export interface NotificationConsole {
  filteredConsoleData: ko.ObservableArray<ConsoleData>;
  isConsoleExpanded: ko.Observable<boolean>;

  expandConsole(source: any, evt: MouseEvent): void;
  collapseConsole(source: any, evt: MouseEvent): void;
}

export interface WaitsForTemplate {
  isTemplateReady: ko.Observable<boolean>;
}

export interface AdHocAccessData {
  readWriteUrl: string;
  readUrl: string;
}

export interface TreeNode {
  nodeKind: string;
  rid: string;
  id: ko.Observable<string>;
  database?: Database;
  collection?: Collection;
  contextMenu?: ContextMenu;

  onNewQueryClick?(source: any, event: MouseEvent): void;
  onNewStoredProcedureClick?(source: Collection, event: MouseEvent): void;
  onNewUserDefinedFunctionClick?(source: Collection, event: MouseEvent): void;
  onNewTriggerClick?(source: Collection, event: MouseEvent): void;
}

export interface Database extends TreeNode {
  container: Explorer;
  self: string;
  id: ko.Observable<string>;
  collections: ko.ObservableArray<Collection>;
  offer: ko.Observable<DataModels.Offer>;
  isDatabaseExpanded: ko.Observable<boolean>;
  isDatabaseShared: ko.Computed<boolean>;

  selectedSubnodeKind: ko.Observable<CollectionTabKind>;

  selectDatabase(): void;
  expandDatabase(): void;
  collapseDatabase(): void;

  loadCollections(): Q.Promise<void>;
  findCollectionWithId(collectionRid: string): Collection;
  openAddCollection(database: Database, event: MouseEvent): void;
  onDeleteDatabaseContextMenuClick(source: Database, event: MouseEvent | KeyboardEvent): void;
  refreshTabSelectedState(): void;
  readSettings(): void;
  onSettingsClick: () => void;
}

export interface CollectionBase extends TreeNode {
  container: Explorer;
  databaseId: string;
  self: string;
  rawDataModel: DataModels.Collection;
  partitionKey: DataModels.PartitionKey;
  partitionKeyProperty: string;
  partitionKeyPropertyHeader: string;
  id: ko.Observable<string>;
  selectedSubnodeKind: ko.Observable<CollectionTabKind>;
  children: ko.ObservableArray<TreeNode>;
  isCollectionExpanded: ko.Observable<boolean>;

  onDocumentDBDocumentsClick(): void;
  onNewQueryClick(source: any, event: MouseEvent, queryText?: string): void;
  expandCollection(): Q.Promise<any>;
  collapseCollection(): void;
  refreshActiveTab(): void;
  getDatabase(): Database;
}

export interface Collection extends CollectionBase {
  defaultTtl: ko.Observable<number>;
  analyticalStorageTtl: ko.Observable<number>;
  indexingPolicy: ko.Observable<DataModels.IndexingPolicy>;
  uniqueKeyPolicy: DataModels.UniqueKeyPolicy;
  quotaInfo: ko.Observable<DataModels.CollectionQuotaInfo>;
  offer: ko.Observable<DataModels.Offer>;
  conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;
  documentIds: ko.ObservableArray<DocumentId>;

  cassandraKeys: CassandraTableKeys;
  cassandraSchema: CassandraTableKey[];

  onConflictsClick(): void;
  onTableEntitiesClick(): void;
  onGraphDocumentsClick(): void;
  onMongoDBDocumentsClick(): void;
  openTab(): void;

  onSettingsClick: () => void;
  readSettings(): Q.Promise<void>;
  onDeleteCollectionContextMenuClick(source: Collection, event: MouseEvent): void;

  onNewGraphClick(): void;
  onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string): void;
  onNewMongoShellClick(): void;
  onNewStoredProcedureClick(source: Collection, event: MouseEvent): void;
  onNewUserDefinedFunctionClick(source: Collection, event: MouseEvent): void;
  onNewTriggerClick(source: Collection, event: MouseEvent): void;
  storedProcedures: ko.Computed<StoredProcedure[]>;
  userDefinedFunctions: ko.Computed<UserDefinedFunction[]>;
  triggers: ko.Computed<Trigger[]>;

  isStoredProceduresExpanded: ko.Observable<boolean>;
  isTriggersExpanded: ko.Observable<boolean>;
  isUserDefinedFunctionsExpanded: ko.Observable<boolean>;

  expandStoredProcedures(): void;
  expandUserDefinedFunctions(): void;
  expandTriggers(): void;

  collapseStoredProcedures(): void;
  collapseUserDefinedFunctions(): void;
  collapseTriggers(): void;

  loadUserDefinedFunctions(): Q.Promise<any>;
  loadStoredProcedures(): Q.Promise<any>;
  loadTriggers(): Q.Promise<any>;

  createStoredProcedureNode(data: DataModels.StoredProcedure): StoredProcedure;
  createUserDefinedFunctionNode(data: DataModels.UserDefinedFunction): UserDefinedFunction;
  createTriggerNode(data: DataModels.Trigger): Trigger;
  findStoredProcedureWithId(sprocRid: string): StoredProcedure;
  findTriggerWithId(triggerRid: string): Trigger;
  findUserDefinedFunctionWithId(udfRid: string): UserDefinedFunction;

  onDragOver(source: Collection, event: { originalEvent: DragEvent }): void;
  onDrop(source: Collection, event: { originalEvent: DragEvent }): void;
  uploadFiles(fileList: FileList): Q.Promise<UploadDetails>;

  getLabel(): string;
}

export interface DocumentId {
  container: DocumentsTab;
  rid: string;
  self: string;
  ts: string;
  partitionKeyValue: any;
  partitionKeyProperty: string;
  partitionKey: DataModels.PartitionKey;
  stringPartitionKeyValue: string;
  id: ko.Observable<string>;

  isDirty: ko.Observable<boolean>;
  click(): void;
  getPartitionKeyValueAsString(): string;
  loadDocument(): Q.Promise<any>;
  partitionKeyHeader(): Object;
}

export interface ConflictId {
  container: ConflictsTab;
  rid: string;
  self: string;
  ts: string;
  partitionKeyValue: any;
  partitionKeyProperty: string;
  partitionKey: DataModels.PartitionKey;
  stringPartitionKeyValue: string;
  id: ko.Observable<string>;
  operationType: string;
  resourceId: string;
  resourceType: string;

  isDirty: ko.Observable<boolean>;
  click(): void;
  buildDocumentIdFromConflict(partitionKeyValue: any): DocumentId;
  getPartitionKeyValueAsString(): string;
  loadConflict(): Q.Promise<any>;
}

export interface StoredProcedure extends TreeNode {
  container: Explorer;
  collection: Collection;
  rid: string;
  self: string;
  id: ko.Observable<string>;
  body: ko.Observable<string>;

  delete(source: TreeNode, event: MouseEvent | KeyboardEvent): void;
  open: () => void;
  select(): void;
  execute(params: string[], partitionKeyValue?: string): void;
}

export interface UserDefinedFunction extends TreeNode {
  container: Explorer;
  collection: Collection;
  rid: string;
  self: string;
  id: ko.Observable<string>;
  body: ko.Observable<string>;

  delete(source: TreeNode, event: MouseEvent | KeyboardEvent): void;
  open: () => void;
  select(): void;
}

export interface Trigger extends TreeNode {
  container: Explorer;
  collection: Collection;
  rid: string;
  self: string;
  id: ko.Observable<string>;
  body: ko.Observable<string>;
  triggerType: ko.Observable<string>;
  triggerOperation: ko.Observable<string>;

  delete(source: TreeNode, event: MouseEvent | KeyboardEvent): void;
  open: () => void;
  select(): void;
}

/**
 * Options used to initialize pane
 */
export interface PaneOptions {
  id: string;
  documentClientUtility: DocumentClientUtilityBase;
  visible: ko.Observable<boolean>;
  container?: Explorer;
}

export interface ContextualPane {
  documentClientUtility: DocumentClientUtilityBase;
  formErrors: ko.Observable<string>;
  formErrorsDetails: ko.Observable<string>;
  id: string;
  title: ko.Observable<string>;
  visible: ko.Observable<boolean>;
  firstFieldHasFocus: ko.Observable<boolean>;
  isExecuting: ko.Observable<boolean>;

  submit: () => void;
  cancel: () => void;
  open: () => void;
  close: () => void;
  resetData: () => void;
  showErrorDetails: () => void;
  onCloseKeyPress(source: any, event: KeyboardEvent): void;
  onPaneKeyDown(source: any, event: KeyboardEvent): boolean;
}

export interface GitHubReposPaneOptions extends PaneOptions {
  gitHubClient: GitHubClient;
  junoClient: JunoClient;
}

export interface AddCollectionPaneOptions extends PaneOptions {
  isPreferredApiTable: ko.Computed<boolean>;
  databaseId?: string;
  databaseSelfLink?: string;
}

export interface AddCollectionPane extends ContextualPane {
  collectionIdTitle: ko.Observable<string>;
  collectionWithThroughputInSharedTitle: ko.Observable<string>;
  databaseId: ko.Observable<string>;
  partitionKey: ko.Observable<string>;
  storage: ko.Observable<string>;
  throughputSinglePartition: ko.Observable<number>;
  throughputMultiPartition: ko.Observable<number>;

  open: (databaseId?: string) => void;
  onStorageOptionsKeyDown(source: any, event: KeyboardEvent): boolean;
  onRupmOptionsKeyDown(source: any, event: KeyboardEvent): void;
  onEnableSynapseLinkButtonClicked: () => void;
}

export interface AddDatabasePane extends ContextualPane {}

export interface DeleteDatabaseConfirmationPane extends ContextualPane {
  databaseIdConfirmation: ko.Observable<string>;
  databaseIdConfirmationText: ko.Observable<string>;
  databaseDeleteFeedback: ko.Observable<string>;
}

export interface DeleteCollectionConfirmationPane extends ContextualPane {
  collectionIdConfirmation: ko.Observable<string>;
  collectionIdConfirmationText: ko.Observable<string>;
  containerDeleteFeedback: ko.Observable<string>;
  recordDeleteFeedback: ko.Observable<boolean>;
}

export interface SettingsPane extends ContextualPane {
  pageOption: ko.Observable<string>;
  customItemPerPage: ko.Observable<number>;
  crossPartitionQueryEnabled: ko.Observable<boolean>;
  maxDegreeOfParallelism: ko.Observable<number>;
  shouldShowQueryPageOptions: ko.Computed<boolean>;

  onCustomPageOptionsKeyDown(source: any, event: KeyboardEvent): boolean;
  onUnlimitedPageOptionKeyDown(source: any, event: KeyboardEvent): boolean;
  onJsonDisplayResultsKeyDown(source: any, event: KeyboardEvent): boolean;
  onGraphDisplayResultsKeyDown(source: any, event: KeyboardEvent): boolean;
}

export interface ExecuteSprocParamsPane extends ContextualPane {
  params: ko.ObservableArray<ExecuteSprocParam>;
  partitionKeyValue: ko.Observable<string>;

  addNewParam(): void;
}

export interface RenewAdHocAccessPane extends ContextualPane {
  accessKey: ko.Observable<string>;
}

export interface UploadItemsPane extends ContextualPane {
  selectedFilesTitle: ko.Observable<string>;
  files: ko.Observable<FileList>;

  updateSelectedFiles(element: any, event: any): void;
}

export interface LoadQueryPane extends ContextualPane {
  selectedFilesTitle: ko.Observable<string>;
  files: ko.Observable<FileList>;

  loadQueryFromFile(file: File): Q.Promise<void>;
}

export interface BrowseQueriesPane extends ContextualPane {
  loadSavedQuery: (savedQuery: DataModels.Query) => void;
}

export interface UploadFilePaneOpenOptions {
  paneTitle: string;
  selectFileInputLabel: string;
  errorMessage: string; // Could not upload notebook
  inProgressMessage: string; // Uploading notebook
  successMessage: string; // Successfully uploaded notebook
  onSubmit: (file: File) => Promise<any>;
  extensions?: string; // input accept field. E.g: .ipynb
  submitButtonLabel?: string;
}

export interface StringInputPaneOpenOptions {
  paneTitle: string;
  inputLabel: string;
  errorMessage: string;
  inProgressMessage: string;
  successMessage: string;
  onSubmit: (input: string) => Promise<any>;
  submitButtonLabel: string;
  defaultInput?: string;
}

export interface UploadFilePane extends ContextualPane {
  openWithOptions: (options: UploadFilePaneOpenOptions) => void;
}

/**
 * Graph configuration
 */
export enum NeighborType {
  SOURCES_ONLY,
  TARGETS_ONLY,
  BOTH
}

/**
 * Set of observable related to graph configuration by user
 */
export interface GraphConfigUiData {
  showNeighborType: ko.Observable<NeighborType>;
  nodeProperties: ko.ObservableArray<string>;
  nodePropertiesWithNone: ko.ObservableArray<string>;
  nodeCaptionChoice: ko.Observable<string>;
  nodeColorKeyChoice: ko.Observable<string>;
  nodeIconChoice: ko.Observable<string>;
  nodeIconSet: ko.Observable<string>;
}

/**
 * User input for creating new vertex
 */
export interface NewVertexData {
  label: string;
  properties: InputProperty[];
}

export type GremlinPropertyValueType = string | boolean | number | null | undefined;
export type InputPropertyValueTypeString = "string" | "number" | "boolean" | "null";
export interface InputPropertyValue {
  value: GremlinPropertyValueType;
  type: InputPropertyValueTypeString;
}
/**
 * Property input by user
 */
export interface InputProperty {
  key: string;
  values: InputPropertyValue[];
}

export interface GraphStylingPane extends ContextualPane {
  setData(graphConfigUIData: GraphConfigUiData): void;
}

export interface NewVertexPane extends ContextualPane {
  setPartitionKeyProperty: (pKeyProp: string) => void;
  subscribeOnSubmitCreate: (callback: (newVertexData: NewVertexData) => void) => void;
}

export interface AddTableEntityPane extends ContextualPane {
  tableViewModel: TableEntityListViewModel;
}

export interface EditTableEntityPane extends ContextualPane {
  originEntity: Entities.ITableEntity;
  tableViewModel: TableEntityListViewModel;
  originalNumberOfProperties: number;
}

export interface TableColumnOptionsPane extends ContextualPane {
  tableViewModel: TableEntityListViewModel;
  parameters: IColumnSetting;
  setDisplayedColumns(columnNames: string[], order: number[], visible: boolean[]): void;
}

export interface QuerySelectPane extends ContextualPane {
  queryViewModel: QueryViewModel;
}

export interface CassandraAddCollectionPane extends ContextualPane {
  createTableQuery: ko.Observable<string>;
  keyspaceId: ko.Observable<string>;
  userTableQuery: ko.Observable<string>;
}

export interface Editable<T> extends ko.Observable<T> {
  setBaseline(baseline: T): void;

  editableIsDirty: ko.Computed<boolean>;
  editableIsValid: ko.Observable<boolean>;
  getEditableCurrentValue?: ko.Computed<T>;
  getEditableOriginalValue?: ko.Computed<T>;
  edits?: ko.ObservableArray<T>;
  validations?: ko.ObservableArray<(value: T) => boolean>;
}

export interface QueryError {
  message: string;
  start: string;
  end: string;
  code: string;
  severity: string;
}

export interface DocumentRequestContainer {
  self: string;
  rid?: string;
  resourceName?: string;
}

export interface NotificationsClient {
  fetchNotifications(): Q.Promise<DataModels.Notification[]>;
  setExtensionEndpoint(extensionEndpoint: string): void;
}

export interface QueriesClient {
  setupQueriesCollection(): Promise<DataModels.Collection>;
  saveQuery(query: DataModels.Query): Promise<void>;
  getQueries(): Promise<DataModels.Query[]>;
  deleteQuery(query: DataModels.Query): Promise<void>;
  getResourceId(): string;
}

export interface DocumentClientOption {
  endpoint?: string;
  masterKey?: string;
  requestTimeoutMs?: number;
}

// Tab options
export interface TabOptions {
  tabKind: CollectionTabKind;
  title: string;
  tabPath: string;
  documentClientUtility: DocumentClientUtilityBase;
  selfLink: string;
  isActive: ko.Observable<boolean>;
  hashLocation: string;
  onUpdateTabsButtons: (buttons: NavbarButtonConfig[]) => void;
  isTabsContentExpanded?: ko.Observable<boolean>;
  onLoadStartKey?: number;
  openedTabs: Tab[];

  // TODO Remove the flag and use a context to handle this
  // TODO: 145357 Remove dependency on collection/database and add abstraction
  collection?: CollectionBase;
  database?: Database;
  rid?: string;
  node?: TreeNode;
  theme?: string;
}

export interface SparkMasterTabOptions extends TabOptions {
  clusterConnectionInfo: DataModels.SparkClusterConnectionInfo;
  container: Explorer;
}

export interface GraphTabOptions extends TabOptions {
  account: DatabaseAccount;
  masterKey: string;
  collectionId: string;
  databaseId: string;
  collectionPartitionKeyProperty: string;
}

export interface NotebookTabOptions extends TabOptions {
  account: DatabaseAccount;
  masterKey: string;
  container: Explorer;
  notebookContentItem: NotebookContentItem;
}

export interface TerminalTabOptions extends TabOptions {
  account: DatabaseAccount;
  container: Explorer;
  kind: TerminalKind;
}

export interface GalleryTabOptions extends TabOptions {
  account: DatabaseAccount;
  container: Explorer;
}

export interface NotebookViewerTabOptions extends TabOptions {
  account: DatabaseAccount;
  container: Explorer;
  notebookUrl: string;
  notebookName: string;
  notebookMetadata: DataModels.NotebookMetadata;
  onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>;
  isLikedNotebook: boolean;
}

export interface DocumentsTabOptions extends TabOptions {
  partitionKey: DataModels.PartitionKey;
  documentIds: ko.ObservableArray<DocumentId>;
  container?: Explorer;
  isPreferredApiMongoDB?: boolean;
  resourceTokenPartitionKey?: string;
}

export interface ConflictsTabOptions extends TabOptions {
  partitionKey: DataModels.PartitionKey;
  conflictIds: ko.ObservableArray<ConflictId>;
  container?: Explorer;
}

export interface QueryTabOptions extends TabOptions {
  partitionKey?: DataModels.PartitionKey;
  queryText?: string;
  resourceTokenPartitionKey?: string;
}

export interface ScriptTabOption extends TabOptions {
  resource: any;
  isNew: boolean;
  collectionSelfLink?: string;
  partitionKey?: DataModels.PartitionKey;
}

// Tabs
export interface Tab {
  documentClientUtility: DocumentClientUtilityBase;
  node: TreeNode; // Can be null
  collection: CollectionBase;
  rid: string;

  tabKind: CollectionTabKind;
  tabId: string;
  isActive: ko.Observable<boolean>;
  isMouseOver: ko.Observable<boolean>;
  tabPath: ko.Observable<string>;
  tabTitle: ko.Observable<string>;
  hashLocation: ko.Observable<string>;
  closeTabButton: Button;
  onCloseTabButtonClick(): Q.Promise<any>;
  onTabClick(): Q.Promise<any>;
  onKeyPressActivate(source: any, event: KeyboardEvent): void;
  onKeyPressClose(source: any, event: KeyboardEvent): void;
  onActivate(): Q.Promise<any>;
  refresh(): void;
  nextTab: ko.Observable<Tab>;
  previousTab: ko.Observable<Tab>;
  closeButtonTabIndex: ko.Computed<number>;
  isExecutionError: ko.Observable<boolean>;
  isExecuting: ko.Observable<boolean>;
}

export interface DocumentsTab extends Tab {
  /* Documents Grid  */
  selectDocument(documentId: DocumentId): Q.Promise<any>;
  selectedDocumentId: ko.Observable<DocumentId>;
  selectedDocumentContent: Editable<any>;
  onDocumentIdClick(documentId: DocumentId): Q.Promise<any>;
  dataContentsGridScrollHeight: ko.Observable<string>;
  accessibleDocumentList: AccessibleVerticalList;
  documentContentsGridId: string;

  partitionKey: DataModels.PartitionKey;
  idHeader: string;
  partitionKeyPropertyHeader: string;
  partitionKeyProperty: string;
  documentIds: ko.ObservableArray<DocumentId>;

  /* Documents Filter */
  filterContent: ko.Observable<string>;
  appliedFilter: ko.Observable<string>;
  lastFilterContents: ko.ObservableArray<string>;
  isFilterExpanded: ko.Observable<boolean>;
  applyFilterButton: Button;
  onShowFilterClick(): Q.Promise<any>;
  onHideFilterClick(): Q.Promise<any>;
  onApplyFilterClick(): Q.Promise<any>;

  /* Document Editor */
  isEditorDirty: ko.Computed<boolean>;
  editorState: ko.Observable<DocumentExplorerState>;
  onValidDocumentEdit(content: any): Q.Promise<any>;
  onInvalidDocumentEdit(content: any): Q.Promise<any>;

  onNewDocumentClick(): Q.Promise<any>;
  onSaveNewDocumentClick(): Q.Promise<any>;
  onRevertNewDocumentClick(): Q.Promise<any>;
  onSaveExisitingDocumentClick(): Q.Promise<any>;
  onRevertExisitingDocumentClick(): Q.Promise<any>;
  onDeleteExisitingDocumentClick(): Q.Promise<any>;

  /* Errors */
  displayedError: ko.Observable<string>;

  initDocumentEditor(documentId: DocumentId, content: any): Q.Promise<any>;
  loadNextPage(): Q.Promise<any>;
}

export interface ConflictsTab extends Tab {
  /* Conflicts Grid  */
  selectedConflictId: ko.Observable<ConflictId>;
  selectedConflictContent: Editable<any>;
  selectedConflictCurrent: Editable<any>;
  onConflictIdClick(conflictId: ConflictId): Q.Promise<any>;
  dataContentsGridScrollHeight: ko.Observable<string>;
  accessibleDocumentList: AccessibleVerticalList;
  documentContentsGridId: string;

  partitionKey: DataModels.PartitionKey;
  partitionKeyPropertyHeader: string;
  partitionKeyProperty: string;
  conflictIds: ko.ObservableArray<ConflictId>;

  /* Document Editor */
  isEditorDirty: ko.Computed<boolean>;
  editorState: ko.Observable<DocumentExplorerState>;
  onValidDocumentEdit(content: any): Q.Promise<any>;
  onInvalidDocumentEdit(content: any): Q.Promise<any>;
  loadingConflictData: ko.Observable<boolean>;

  onAcceptChangesClick(): Q.Promise<any>;
  onDiscardClick(): Q.Promise<any>;

  initDocumentEditorForCreate(documentId: ConflictId, documentToInsert: any): Q.Promise<any>;
  initDocumentEditorForReplace(documentId: ConflictId, conflictContent: any, currentContent: any): Q.Promise<any>;
  initDocumentEditorForDelete(documentId: ConflictId, documentToDelete: any): Q.Promise<any>;
  initDocumentEditorForNoOp(conflictId: ConflictId): Q.Promise<any>;
  loadNextPage(): Q.Promise<any>;
}

export interface SettingsTab extends Tab {
  /*state*/
  throughput: ko.Observable<number>;
  timeToLive: ko.Observable<string>;
  timeToLiveSeconds: ko.Observable<number>;
  geospatialVisible: ko.Computed<boolean>;
  geospatialConfigType: ko.Observable<string>;
  indexingPolicyContent: ko.Observable<DataModels.IndexingPolicy>;
  rupm: ko.Observable<string>;
  requestUnitsUsageCost: ko.Computed<string>;
  canThroughputExceedMaximumValue: ko.Computed<boolean>;
  shouldDisplayPortalUsePrompt: ko.Computed<boolean>;
  warningMessage: ko.Computed<string>;
  ttlOffFocused: ko.Observable<boolean>;
  ttlOnDefaultFocused: ko.Observable<boolean>;
  ttlOnFocused: ko.Observable<boolean>;
  indexingPolicyElementFocused: ko.Observable<boolean>;
  notificationStatusInfo: ko.Observable<string>;
  shouldShowNotificationStatusPrompt: ko.Computed<boolean>;
  shouldShowStatusBar: ko.Computed<boolean>;
  pendingNotification: ko.Observable<DataModels.Notification>;

  conflictResolutionPolicyMode: ko.Observable<string>;
  conflictResolutionPolicyPath: ko.Observable<string>;
  conflictResolutionPolicyProcedure: ko.Observable<string>;

  rupmVisible: ko.Computed<boolean>;
  costsVisible: ko.Computed<boolean>;
  minRUAnotationVisible: ko.Computed<boolean>;

  /* Command Bar */
  saveSettingsButton: Button;
  discardSettingsChangesButton: Button;
  onSaveClick(): Q.Promise<any>;
  onRevertClick(): Q.Promise<any>;

  /* Indexing Policy Editor */
  isIndexingPolicyEditorInitializing: ko.Observable<boolean>;
  indexingPolicyEditor: ko.Observable<monaco.editor.IStandaloneCodeEditor>;
  onValidIndexingPolicyEdit(content: any): Q.Promise<any>;
  onInvalidIndexingPolicyEdit(content: any): Q.Promise<any>;

  onSaveClick(): Q.Promise<any>;
  onRevertClick(): Q.Promise<any>;
}

export interface DatabaseSettingsTab extends Tab {
  /*state*/
  throughput: ko.Observable<number>;
  requestUnitsUsageCost: ko.PureComputed<string>;
  canThroughputExceedMaximumValue: ko.Computed<boolean>;
  warningMessage: ko.Computed<string>;
  notificationStatusInfo: ko.Observable<string>;
  shouldShowNotificationStatusPrompt: ko.Computed<boolean>;
  shouldShowStatusBar: ko.Computed<boolean>;
  pendingNotification: ko.Observable<DataModels.Notification>;

  costsVisible: ko.Computed<boolean>;
  minRUAnotationVisible: ko.Computed<boolean>;

  /* Command Bar */
  saveSettingsButton: Button;
  discardSettingsChangesButton: Button;
  onSaveClick(): Q.Promise<any>;
  onRevertClick(): Q.Promise<any>;

  /* Errors */
  displayedError: ko.Observable<string>;

  onSaveClick(): Q.Promise<any>;
  onRevertClick(): Q.Promise<any>;
}

export interface WaitsForTemplate {
  isTemplateReady: ko.Observable<boolean>;
}

export interface QueryTab extends Tab {
  queryEditorId: string;
  isQueryMetricsEnabled: ko.Computed<boolean>;
  activityId: ko.Observable<string>;

  /* Command Bar */
  executeQueryButton: Button;
  fetchNextPageButton: Button;
  saveQueryButton: Button;
  onExecuteQueryClick(): Q.Promise<any>;
  onFetchNextPageClick(): Q.Promise<any>;

  /*Query Editor*/
  initialEditorContent: ko.Observable<string>;
  sqlQueryEditorContent: ko.Observable<string>;
  sqlStatementToExecute: ko.Observable<string>;

  /* Results */
  allResultsMetadata: ko.ObservableArray<QueryResultsMetadata>;

  /* Errors */
  errors: ko.ObservableArray<QueryError>;

  /* Status  */
  statusMessge: ko.Observable<string>;
  statusIcon: ko.Observable<string>;
}

export interface ScriptTab extends Tab {
  id: Editable<string>;
  editorId: string;

  saveButton: Button;
  updateButton: Button;
  discardButton: Button;
  deleteButton: Button;

  editorState: ko.Observable<ScriptEditorState>;
  editorContent: ko.Observable<string>;
  editor: ko.Observable<monaco.editor.IStandaloneCodeEditor>;

  errors: ko.ObservableArray<QueryError>;
  statusMessge: ko.Observable<string>;
  statusIcon: ko.Observable<string>;

  formFields: ko.ObservableArray<Editable<any>>;
  formIsValid: ko.Computed<boolean>;
  formIsDirty: ko.Computed<boolean>;

  isNew: ko.Observable<boolean>;
  resource: ko.Observable<DataModels.Resource>;

  setBaselines(): void;
}

export interface StoredProcedureTab extends ScriptTab {
  onExecuteSprocsResult(result: any, logsData: any): void;
  onExecuteSprocsError(error: string): void;
}

export interface UserDefinedFunctionTab extends ScriptTab {}

export interface TriggerTab extends ScriptTab {
  triggerType: Editable<string>;
  triggerOperation: Editable<string>;
}

export interface GraphTab extends Tab {}
export interface NotebookTab extends Tab {}
export interface EditorPosition {
  line: number;
  column: number;
}

export interface MongoShellTab extends Tab {}

export enum DocumentExplorerState {
  noDocumentSelected,
  newDocumentValid,
  newDocumentInvalid,
  exisitingDocumentNoEdits,
  exisitingDocumentDirtyValid,
  exisitingDocumentDirtyInvalid
}

export enum IndexingPolicyEditorState {
  noCollectionSelected,
  noEdits,
  dirtyValid,
  dirtyInvalid
}

export enum ScriptEditorState {
  newInvalid,
  newValid,
  exisitingNoEdits,
  exisitingDirtyValid,
  exisitingDirtyInvalid
}

export enum CollectionTabKind {
  Documents = 0,
  Settings = 1,
  StoredProcedures = 2,
  UserDefinedFunctions = 3,
  Triggers = 4,
  Query = 5,
  Graph = 6,
  QueryTables = 9,
  MongoShell = 10,
  DatabaseSettings = 11,
  Conflicts = 12,
  Notebook = 13,
  Terminal = 14,
  NotebookV2 = 15,
  SparkMasterTab = 16,
  Gallery = 17,
  NotebookViewer = 18
}

export enum TerminalKind {
  Default = 0,
  Mongo = 1,
  Cassandra = 2
}

export interface ContextMenu {
  container: Explorer;
  visible: ko.Observable<boolean>;
  elementId: string;
  options: ko.ObservableArray<CommandButtonOptions>;
  tabIndex: ko.Observable<number>;

  show(source: any, event: MouseEvent | KeyboardEvent): void;
  hide(source: any, event: MouseEvent | KeyboardEvent): void;
}

export interface DataExplorerInputsFrame {
  databaseAccount: any;
  subscriptionId: string;
  resourceGroup: string;
  masterKey: string;
  hasWriteAccess: boolean;
  authorizationToken: string;
  features: any;
  csmEndpoint: string;
  dnsSuffix: string;
  serverId: string;
  extensionEndpoint: string;
  subscriptionType: SubscriptionType;
  quotaId: string;
  addCollectionDefaultFlight: string;
  isTryCosmosDBSubscription: boolean;
  loadDatabaseAccountTimestamp?: number;
  sharedThroughputMinimum?: number;
  sharedThroughputMaximum?: number;
  sharedThroughputDefault?: number;
  dataExplorerVersion?: string;
  isAuthWithresourceToken?: boolean;
  defaultCollectionThroughput?: CollectionCreationDefaults;
}

export interface CollectionCreationDefaults {
  storage: string;
  throughput: ThroughputDefaults;
}

export interface ThroughputDefaults {
  fixed: number;
  unlimited:
    | number
    | {
        collectionThreshold: number;
        lessThanOrEqualToThreshold: number;
        greatThanThreshold: number;
      };
  unlimitedmax: number;
  unlimitedmin: number;
  shared: number;
}

export enum SubscriptionType {
  Benefits,
  EA,
  Free,
  Internal,
  PAYG
}

export class MonacoEditorSettings {
  public readonly language: string;
  public readonly readOnly: boolean;

  constructor(supportedLanguage: string, isReadOnly: boolean) {
    this.language = supportedLanguage;
    this.readOnly = isReadOnly;
  }
}

export interface AuthorizationTokenHeaderMetadata {
  header: string;
  token: string;
}

export interface TelemetryActions {
  sendEvent(name: string, telemetryProperties?: { [propertyName: string]: string }): Q.Promise<any>;
  sendError(errorInfo: DataModels.ITelemetryError): Q.Promise<any>;
  sendMetric(
    name: string,
    metricNumber: number,
    telemetryProperties?: { [propertyName: string]: string }
  ): Q.Promise<any>;
}

export interface ConfigurationOverrides {
  EnableBsonSchema: string;
}

export interface CosmosDbApi {
  isSystemDatabasePredicate: (database: Database) => boolean;
}

export interface DropdownOption<T> {
  text: string;
  value: T;
  disable?: boolean;
}

export interface INotebookContainerClient {
  resetWorkspace: () => Promise<void>;
}

export interface INotebookContentClient {
  updateItemChildren: (item: NotebookContentItem) => Promise<void>;
  createNewNotebookFile: (parent: NotebookContentItem) => Promise<NotebookContentItem>;
  deleteContentItem: (item: NotebookContentItem) => Promise<void>;
  uploadFileAsync: (name: string, content: string, parent: NotebookContentItem) => Promise<NotebookContentItem>;
  renameNotebook: (item: NotebookContentItem, targetName: string) => Promise<NotebookContentItem>;
  createDirectory: (parent: NotebookContentItem, newDirectoryName: string) => Promise<NotebookContentItem>;
  readFileContent: (filePath: string) => Promise<string>;
}
