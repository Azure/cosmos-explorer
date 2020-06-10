import * as DataModels from "../../src/Contracts/DataModels";
import * as ko from "knockout";
import * as ViewModels from "../../src/Contracts/ViewModels";
import DocumentClientUtilityBase from "../Common/DocumentClientUtilityBase";
import Q from "q";
import { ArcadiaWorkspaceItem } from "./Controls/Arcadia/ArcadiaMenuPicker";
import { CassandraTableKey, CassandraTableKeys, TableDataClient } from "../../src/Explorer/Tables/TableDataClient";
import { ConsoleData } from "../../src/Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { IContentProvider } from "@nteract/core";
import { MostRecentActivity } from "./MostRecentActivity/MostRecentActivity";
import { NotebookContentItem } from "./Notebook/NotebookContentItem";
import { PlatformType } from "../../src/PlatformType";
import { QuerySelectPane } from "../../src/Explorer/Panes/Tables/QuerySelectPane";
import { SetupNotebooksPane } from "./Panes/SetupNotebooksPane";
import { Splitter } from "../../src/Common/Splitter";
import { StringInputPane } from "./Panes/StringInputPane";
import { TableColumnOptionsPane } from "../../src/Explorer/Panes/Tables/TableColumnOptionsPane";
import { TextFieldProps } from "./Controls/DialogReactComponent/DialogComponent";
import { UploadDetails } from "../workers/upload/definitions";
import { UploadFilePane } from "./Panes/UploadFilePane";
import { UploadItemsPaneAdapter } from "./Panes/UploadItemsPaneAdapter";
import { Versions } from "../../src/Contracts/ExplorerContracts";
import { CollectionCreationDefaults } from "../Shared/Constants";

export class ExplorerStub implements ViewModels.Explorer {
  public flight: ko.Observable<string>;
  public addCollectionText: ko.Observable<string>;
  public hasAutoPilotV2FeatureFlag: ko.Computed<boolean>;
  public addDatabaseText: ko.Observable<string>;
  public collectionTitle: ko.Observable<string>;
  public deleteCollectionText: ko.Observable<string>;
  public deleteDatabaseText: ko.Observable<string>;
  public collectionTreeNodeAltText: ko.Observable<string>;
  public refreshTreeTitle: ko.Observable<string>;
  public collapsedResourceTreeWidth: number;
  public collectionCreationDefaults: ViewModels.CollectionCreationDefaults = CollectionCreationDefaults;
  public hasWriteAccess: ko.Observable<boolean> = ko.observable<boolean>(false);
  public databaseAccount: ko.Observable<ViewModels.DatabaseAccount>;
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
  public extensionEndpoint: ko.Observable<string> = ko.observable<string>(undefined);
  public armEndpoint: ko.Observable<string>;
  public isTryCosmosDBSubscription: ko.Observable<boolean>;
  public documentClientUtility: DocumentClientUtilityBase;
  public notificationsClient: ViewModels.NotificationsClient;
  public queriesClient: ViewModels.QueriesClient;
  public tableDataClient: TableDataClient;
  public splitter: Splitter;
  public notificationConsoleData: ko.ObservableArray<ConsoleData>;
  public isNotificationConsoleExpanded: ko.Observable<boolean>;
  public contextPanes: ViewModels.ContextualPane[];
  public databases: ko.ObservableArray<ViewModels.Database>;
  public nonSystemDatabases: ko.Computed<ViewModels.Database[]>;
  public selectedDatabaseId: ko.Computed<string>;
  public selectedCollectionId: ko.Computed<string>;
  public isLeftPaneExpanded: ko.Observable<boolean>;
  public selectedNode: ko.Observable<ViewModels.TreeNode>;
  public isRefreshingExplorer: ko.Observable<boolean>;
  public openedTabs: ko.ObservableArray<ViewModels.Tab>;
  public isTabsContentExpanded: ko.Observable<boolean>;
  public addCollectionPane: ViewModels.AddCollectionPane;
  public addDatabasePane: ViewModels.AddDatabasePane;
  public deleteCollectionConfirmationPane: ViewModels.DeleteCollectionConfirmationPane;
  public deleteDatabaseConfirmationPane: ViewModels.DeleteDatabaseConfirmationPane;
  public graphStylingPane: ViewModels.GraphStylingPane;
  public addTableEntityPane: ViewModels.AddTableEntityPane;
  public editTableEntityPane: ViewModels.EditTableEntityPane;
  public tableColumnOptionsPane: TableColumnOptionsPane;
  public querySelectPane: QuerySelectPane;
  public newVertexPane: ViewModels.NewVertexPane;
  public cassandraAddCollectionPane: ViewModels.CassandraAddCollectionPane;
  public renewAdHocAccessPane: ViewModels.RenewAdHocAccessPane;
  public renewExplorerShareAccess: (explorer: ViewModels.Explorer, token: string) => Q.Promise<void>;
  public settingsPane: ViewModels.SettingsPane;
  public executeSprocParamsPane: ViewModels.ExecuteSprocParamsPane;
  public uploadItemsPane: ViewModels.UploadItemsPane;
  public uploadItemsPaneAdapter: UploadItemsPaneAdapter;
  public loadQueryPane: ViewModels.LoadQueryPane;
  public saveQueryPane: ViewModels.ContextualPane;
  public browseQueriesPane: ViewModels.BrowseQueriesPane;
  public uploadFilePane: UploadFilePane;
  public stringInputPane: StringInputPane;
  public setupNotebooksPane: SetupNotebooksPane;
  public setupSparkClusterPane: ViewModels.ContextualPane;
  public manageSparkClusterPane: ViewModels.ContextualPane;
  public isGalleryEnabled: ko.Computed<boolean>;
  public isGitHubPaneEnabled: ko.Observable<boolean>;
  public isGraphsEnabled: ko.Computed<boolean>;
  public isRightPanelV2Enabled: ko.Computed<boolean>;
  public canExceedMaximumValue: ko.Computed<boolean>;
  public isHostedDataExplorerEnabled: ko.Computed<boolean>;
  public parentFrameDataExplorerVersion: ko.Observable<string> = ko.observable<string>(Versions.DataExplorer);
  public activeTab: ko.Observable<ViewModels.Tab>;
  public mostRecentActivity: MostRecentActivity;
  public isNotebookEnabled: ko.Observable<boolean>;
  public isSparkEnabled: ko.Observable<boolean>;
  public isNotebooksEnabledForAccount: ko.Observable<boolean>;
  public isSparkEnabledForAccount: ko.Observable<boolean>;
  public arcadiaToken: ko.Observable<string>;
  public notebookWorkspaceManager: ViewModels.NotebookWorkspaceManager;
  public sparkClusterManager: ViewModels.SparkClusterManager;
  public notebookContentProvider: IContentProvider;
  public gitHubOAuthService: GitHubOAuthService;
  public notebookServerInfo: ko.Observable<DataModels.NotebookWorkspaceConnectionInfo>;
  public sparkClusterConnectionInfo: ko.Observable<DataModels.SparkClusterConnectionInfo>;
  public libraryManagePane: ViewModels.ContextualPane;
  public clusterLibraryPane: ViewModels.ContextualPane;
  public gitHubReposPane: ViewModels.ContextualPane;
  public arcadiaWorkspaces: ko.ObservableArray<ArcadiaWorkspaceItem>;
  public hasStorageAnalyticsAfecFeature: ko.Observable<boolean>;
  public isSynapseLinkUpdating: ko.Observable<boolean>;
  public isNotebookTabActive: ko.Computed<boolean>;
  public memoryUsageInfo: ko.Observable<DataModels.MemoryUsageInfo>;
  public openGallery: () => void;
  public openNotebookViewer: (notebookUrl: string) => void;
  public resourceTokenDatabaseId: ko.Observable<string>;
  public resourceTokenCollectionId: ko.Observable<string>;
  public resourceTokenCollection: ko.Observable<ViewModels.CollectionBase>;
  public resourceTokenPartitionKey: ko.Observable<string>;
  public isAuthWithResourceToken: ko.Observable<boolean>;
  public isResourceTokenCollectionNodeSelected: ko.Computed<boolean>;

  private _featureEnabledReturnValue: boolean;

  constructor(options?: any) {
    options = options || {};
    this._featureEnabledReturnValue = options.featureEnabledReturnValue || false;
    this.isSynapseLinkUpdating = ko.observable<boolean>(options.isSynapseLinkUpdating || false);
  }

  public openEnableSynapseLinkDialog() {
    throw new Error("Not implemented");
  }

  public createWorkspace(): Promise<string> {
    throw new Error("Not implemented");
  }

  public createSparkPool(workspaceId: string): Promise<string> {
    throw new Error("Not implemented");
  }

  public isDatabaseNodeOrNoneSelected(): boolean {
    throw new Error("Not implemented");
  }

  public isDatabaseNodeSelected(): boolean {
    throw new Error("Not implemented");
  }

  public isNodeKindSelected(nodeKind: string): boolean {
    throw new Error("Not implemented");
  }

  public isNoneSelected(): boolean {
    throw new Error("Not implemented");
  }

  public isFeatureEnabled(feature: string): boolean {
    return this._featureEnabledReturnValue;
  }

  public isSelectedDatabaseShared(): boolean {
    throw new Error("Not implemented");
  }

  public logConsoleData(consoleData: ConsoleData): void {
    throw new Error("Not implemented");
  }

  public deleteInProgressConsoleDataWithId(id: string): void {
    throw new Error("Not implemented");
  }

  public toggleLeftPaneExpanded() {
    throw new Error("Not implemented");
  }

  public refreshAllDatabases(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public refreshDatabaseForResourceToken(): Q.Promise<void> {
    throw new Error("Note impplemented");
  }

  public onRefreshDatabasesKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onRefreshResourcesClick = (source: any, event: MouseEvent): boolean => {
    throw new Error("Not implemented");
  };

  public toggleLeftPaneExpandedKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  // Facade
  public provideFeedbackEmail = () => {
    throw new Error("Not implemented");
  };

  public handleMessage(event: MessageEvent) {
    throw new Error("Not implemented");
  }

  public findSelectedDatabase(): ViewModels.Database {
    throw new Error("Not implemented");
  }

  public findDatabaseWithId(databaseId: string): ViewModels.Database {
    throw new Error("Not implemented");
  }

  public isLastDatabase(): boolean {
    throw new Error("Not implemented");
  }

  public isLastNonEmptyDatabase(): boolean {
    throw new Error("Not implemented");
  }

  public initDataExplorerWithFrameInputs(inputs: ViewModels.DataExplorerInputsFrame): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public findSelectedCollection(): ViewModels.Collection {
    throw new Error("Not implemented");
  }

  public findCollection(rid: string): ViewModels.Collection {
    throw new Error("Not implemented");
  }

  public isLastCollection(): boolean {
    throw new Error("Not implemented");
  }

  public findActiveTab(): ViewModels.Tab {
    throw new Error("Not implemented");
  }

  public findSelectedStoredProcedure(): ViewModels.StoredProcedure {
    throw new Error("Not implemented");
  }

  public findSelectedUDF(): ViewModels.UserDefinedFunction {
    throw new Error("Not implemented");
  }

  public findSelectedTrigger(): ViewModels.Trigger {
    throw new Error("Not implemented");
  }

  public generateSharedAccessData(): void {
    throw new Error("Not implemented");
  }

  public displayConnectExplorerForm(): void {
    throw new Error("Not implemented");
  }

  public displayContextSwitchPromptForConnectionString(connectionString: string): void {
    throw new Error("Not implemented");
  }

  public hideConnectExplorerForm(): void {
    throw new Error("Not implemented");
  }

  public displayGuestAccessTokenRenewalPrompt(): void {
    throw new Error("Not implemented");
  }

  public expandConsole(): void {
    throw new Error("Not implemented");
  }

  public collapseConsole(): void {
    throw new Error("Not implemented");
  }

  public rebindDocumentClientUtility(documentClientUtility: any) {
    throw new Error("Not implemented");
  }

  public renewShareAccess(token: string): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public closeAllTabsForResource(resourceId: string): void {
    throw new Error("Not implemented");
  }

  public getPlatformType(): PlatformType {
    throw new Error("Not implemented");
  }

  public isRunningOnNationalCloud(): boolean {
    throw new Error("Not implemented");
  }

  public isConnectExplorerVisible(): boolean {
    return false;
  }

  public closeAllPanes(): void {
    // return for now so tests dont break
    // TODO: implement once we start testing pane close
    return;
  }

  public onUpdateTabsButtons(buttons: ViewModels.NavbarButtonConfig[]): void {
    throw new Error("Not implemented");
  }

  public importAndOpen(path: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  public importAndOpenFromGallery(path: string, newName: string, content: any): Promise<boolean> {
    throw new Error("Not implemented");
  }

  public async openNotebook(notebookContentItem: NotebookContentItem): Promise<boolean> {
    throw new Error("Not implemented");
  }

  public deleteNotebookFile(item: NotebookContentItem): Promise<void> {
    throw new Error("Not implemented");
  }

  public onCreateDirectory(parent: NotebookContentItem): Q.Promise<NotebookContentItem> {
    throw new Error("Not implemented");
  }

  public onNewNotebookClicked(parent?: NotebookContentItem): void {
    throw new Error("Not implemented");
  }

  public openNotebookTerminal(): void {
    throw new Error("Not implemented");
  }

  public resetNotebookWorkspace(): void {
    throw new Error("Not implemented");
  }

  public onNewCollectionClicked(): void {
    throw new Error("Not implemented");
  }

  public onUploadToNotebookServerClicked(parent?: NotebookContentItem): void {
    throw new Error("Not implemented");
  }

  public renameNotebook(notebookFile: NotebookContentItem): Q.Promise<NotebookContentItem> {
    throw new Error("Not implemented");
  }

  public readFile(notebookFile: NotebookContentItem): Promise<string> {
    throw new Error("Not implemented");
  }

  public downloadFile(notebookFile: NotebookContentItem): Promise<void> {
    throw new Error("Not implemented");
  }

  public initNotebooks(databaseAccount: DataModels.DatabaseAccount): Promise<void> {
    throw new Error("Not implemented");
  }

  public showOkModalDialog(title: string, msg: string): void {
    throw new Error("Not implemented");
  }

  public showOkCancelModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void
  ): void {
    throw new Error("Not implemented");
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
    throw new Error("Not implemented");
  }

  public deleteCluster(): void {
    throw new Error("Not implemented");
  }

  public async openSparkMasterTab(): Promise<void> {
    throw new Error("Not implemented");
  }

  public createNotebookContentItemFile(name: string, filepath: string): NotebookContentItem {
    throw new Error("Not implemented");
  }

  public closeNotebookTab(filepath: string): void {
    throw new Error("Not implemented");
  }

  public refreshContentItem(item: NotebookContentItem): Promise<void> {
    throw new Error("Not implemented");
  }

  public getNotebookBasePath(): string {
    throw new Error("Not implemented");
  }

  public handleOpenFileAction(): Promise<void> {
    throw new Error("Not implemented");
  }
}

export class DatabaseStub implements ViewModels.Database {
  public nodeKind: string;
  public container: ViewModels.Explorer;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public collections: ko.ObservableArray<ViewModels.Collection>;
  public isDatabaseExpanded: ko.Observable<boolean>;
  public isDatabaseShared: ko.Computed<boolean>;
  public contextMenu: ViewModels.ContextMenu;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public offer: ko.Observable<DataModels.Offer>;

  constructor(options?: any) {
    this.nodeKind = options.nodeKind;
    this.container = options.container;
    this.self = options.self;
    this.rid = options.rid;
    this.id = options.id;
    this.collections = options.collections;
    this.isDatabaseExpanded = options.isDatabaseExpanded;
    this.contextMenu = options.contextMenu;
    this.offer = options.offer;
    this.selectedSubnodeKind = options.selectedSubnodeKind;
  }

  public onKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onMenuKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onDeleteDatabaseContextMenuClick(source: ViewModels.Database, event: MouseEvent | KeyboardEvent) {
    throw new Error("Not implemented");
  }

  public selectDatabase() {
    throw new Error("Not implemented");
  }

  public expandCollapseDatabase() {
    throw new Error("Not implemented");
  }

  public expandDatabase() {
    throw new Error("Not implemented");
  }

  public collapseDatabase() {
    throw new Error("Not implemented");
  }

  public loadCollections(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public findCollectionWithId(collectionId: string): ViewModels.Collection {
    throw new Error("Not implemented");
  }

  public openAddCollection(database: ViewModels.Database, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public refreshTabSelectedState(): void {
    throw new Error("Not implemented");
  }

  public readSettings() {
    throw new Error("Not implemented");
  }

  public onSettingsClick(): void {
    throw new Error("Not implemented");
  }
}

export class CollectionStub implements ViewModels.Collection {
  public nodeKind: string;
  public container: ViewModels.Explorer;
  public rawDataModel: DataModels.Collection;
  public self: string;
  public rid: string;
  public databaseId: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyPropertyHeader: string;
  public partitionKeyProperty: string;
  public id: ko.Observable<string>;
  public defaultTtl: ko.Observable<number>;
  public analyticalStorageTtl: ko.Observable<number>;
  public indexingPolicy: ko.Observable<DataModels.IndexingPolicy>;
  public uniqueKeyPolicy: DataModels.UniqueKeyPolicy;
  public quotaInfo: ko.Observable<DataModels.CollectionQuotaInfo>;
  public offer: ko.Observable<DataModels.Offer>;
  public partitions: ko.Computed<number>;
  public throughput: ko.Computed<number>;
  public cassandraKeys: CassandraTableKeys;
  public cassandraSchema: CassandraTableKey[];
  public documentIds: ko.ObservableArray<ViewModels.DocumentId>;
  public children: ko.ObservableArray<ViewModels.TreeNode>;
  public storedProcedures: ko.Computed<ViewModels.StoredProcedure[]>;
  public userDefinedFunctions: ko.Computed<ViewModels.UserDefinedFunction[]>;
  public triggers: ko.Computed<ViewModels.Trigger[]>;
  public showStoredProcedures: ko.Observable<boolean>;
  public showTriggers: ko.Observable<boolean>;
  public showUserDefinedFunctions: ko.Observable<boolean>;
  public selectedDocumentContent: ViewModels.Editable<any>;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public focusedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public isCollectionExpanded: ko.Observable<boolean>;
  public isStoredProceduresExpanded: ko.Observable<boolean>;
  public isUserDefinedFunctionsExpanded: ko.Observable<boolean>;
  public isTriggersExpanded: ko.Observable<boolean>;
  public documentsFocused: ko.Observable<boolean>;
  public settingsFocused: ko.Observable<boolean>;
  public storedProceduresFocused: ko.Observable<boolean>;
  public userDefinedFunctionsFocused: ko.Observable<boolean>;
  public triggersFocused: ko.Observable<boolean>;
  public contextMenu: ViewModels.ContextMenu;
  public documentsContextMenu: ViewModels.ContextMenu;
  public conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  public changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  public geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;

  constructor(options: any) {
    this.nodeKind = options.nodeKind;
    this.container = options.container;
    this.self = options.self;
    this.rid = options.rid;
    this.databaseId = options.databaseId;
    this.partitionKey = options.partitionKey;
    this.partitionKeyPropertyHeader = options.partitionKeyPropertyHeader;
    this.partitionKeyProperty = options.partitionKeyProperty;
    this.id = options.id;
    this.defaultTtl = options.defaultTtl;
    this.analyticalStorageTtl = options.analyticalStorageTtl;
    this.indexingPolicy = options.indexingPolicy;
    this.uniqueKeyPolicy = options.uniqueKeyPolicy;
    this.quotaInfo = options.quotaInfo;
    this.offer = options.offer;
    this.partitions = options.partitions;
    this.throughput = options.throughput;
    this.cassandraKeys = options.cassandraKeys;
    this.cassandraSchema = options.cassandraSchema;
    this.documentIds = options.documentIds;
    this.children = options.children;
    this.storedProcedures = options.storedProcedures;
    this.userDefinedFunctions = options.userDefinedFunctions;
    this.triggers = options.triggers;
    this.showStoredProcedures = options.showStoredProcedures;
    this.showTriggers = options.showTriggers;
    this.showUserDefinedFunctions = options.showUserDefinedFunctions;
    this.selectedDocumentContent = options.selectedDocumentContent;
    this.selectedSubnodeKind = options.selectedSubnodeKind;
    this.focusedSubnodeKind = options.focusedSubnodeKind;
    this.isCollectionExpanded = options.isCollectionExpanded;
    this.isStoredProceduresExpanded = options.isStoredProceduresExpanded;
    this.isUserDefinedFunctionsExpanded = options.isUserDefinedFunctionsExpanded;
    this.isTriggersExpanded = options.isTriggersExpanded;
    this.documentsFocused = options.documentsFocused;
    this.settingsFocused = options.settingsFocused;
    this.storedProceduresFocused = options.storedProceduresFocused;
    this.userDefinedFunctionsFocused = options.userDefinedFunctionsFocused;
    this.triggersFocused = options.triggersFocused;
    this.contextMenu = options.contextMenu;
    this.documentsContextMenu = options.documentsContextMenu;
  }

  public onKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onMenuKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onDocumentDBDocumentsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onDocumentDBDocumentsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onMongoDBDocumentsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onMongoDBDocumentsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onSettingsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onSettingsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onStoredProceduresKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onStoredProceduresKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onUserDefinedFunctionsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onUserDefinedFunctionsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onTriggersKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onTriggersKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };
  public expandCollapseCollection() {
    throw new Error("Not implemented");
  }

  public collapseCollection() {
    throw new Error("Not implemented");
  }

  public expandCollection(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public onDocumentDBDocumentsClick() {
    throw new Error("onDocumentDBDocumentsClick");
  }

  public onTableEntitiesClick() {
    throw new Error("Not implemented");
  }

  public onGraphDocumentsClick() {
    throw new Error("Not implemented");
  }

  public onMongoDBDocumentsClick = () => {
    throw new Error("Not implemented");
  };

  public openTab = () => {
    throw new Error("Not implemented");
  };

  public onSettingsClick() {
    throw new Error("Not implemented");
  }

  public onConflictsClick() {
    throw new Error("Not implemented");
  }

  public readSettings(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public onNewQueryClick(source: any, event: MouseEvent, queryText?: string) {
    throw new Error("Not implemented");
  }

  public onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string) {
    throw new Error("Not implemented");
  }

  public onNewGraphClick() {
    throw new Error("Not implemented");
  }

  public onNewMongoShellClick() {
    throw new Error("Not implemented");
  }

  public onNewStoredProcedureClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public onNewUserDefinedFunctionClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public onNewTriggerClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public createStoredProcedureNode(data: DataModels.StoredProcedure): ViewModels.StoredProcedure {
    throw new Error("Not implemented");
  }

  public createUserDefinedFunctionNode(data: DataModels.UserDefinedFunction): ViewModels.UserDefinedFunction {
    throw new Error("Not implemented");
  }

  public createTriggerNode(data: DataModels.Trigger): ViewModels.Trigger {
    throw new Error("Not implemented");
  }

  public expandCollapseStoredProcedures() {
    throw new Error("Not implemented");
  }

  public expandStoredProcedures() {
    throw new Error("Not implemented");
  }

  public collapseStoredProcedures() {
    throw new Error("Not implemented");
  }

  public expandCollapseUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public expandUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public collapseUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public expandCollapseTriggers() {
    throw new Error("Not implemented");
  }

  public expandTriggers() {
    throw new Error("Not implemented");
  }

  public collapseTriggers() {
    throw new Error("Not implemented");
  }

  public loadStoredProcedures(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public loadUserDefinedFunctions(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public loadTriggers(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public onDragOver(source: ViewModels.Collection, event: { originalEvent: DragEvent }) {
    throw new Error("Not implemented");
  }

  public onDrop(source: ViewModels.Collection, event: { originalEvent: DragEvent }) {
    throw new Error("Not implemented");
  }

  public isCollectionNodeSelected(): boolean {
    throw new Error("Not implemented");
  }

  public isSubNodeSelected(nodeKind: ViewModels.CollectionTabKind): boolean {
    throw new Error("Not implemented");
  }

  public onDeleteCollectionContextMenuClick(source: ViewModels.Collection, event: MouseEvent | KeyboardEvent) {
    throw new Error("Not implemented");
  }

  public findStoredProcedureWithId(sprocId: string): ViewModels.StoredProcedure {
    throw new Error("Not implemented");
  }

  public findTriggerWithId(triggerId: string): ViewModels.Trigger {
    throw new Error("Not implemented");
  }

  public findUserDefinedFunctionWithId(userDefinedFunctionId: string): ViewModels.UserDefinedFunction {
    throw new Error("Not implemented");
  }

  public uploadFiles = (fileList: FileList): Q.Promise<UploadDetails> => {
    throw new Error("Not implemented");
  };

  public refreshActiveTab = (): void => {
    throw new Error("Not implemented");
  };

  public getLabel(): string {
    throw new Error("Not implemented");
  }

  public getDatabase(): ViewModels.Database {
    throw new Error("Not implemented");
  }
}

class ContextualPaneStub implements ViewModels.ContextualPane {
  public documentClientUtility: DocumentClientUtilityBase;
  public formErrors: ko.Observable<string>;
  public formErrorsDetails: ko.Observable<string>;
  public id: string;
  public title: ko.Observable<string>;
  public visible: ko.Observable<boolean>;
  public firstFieldHasFocus: ko.Observable<boolean>;
  public isExecuting: ko.Observable<boolean>;

  public submit() {
    throw new Error("Not implemented");
  }

  public cancel() {
    throw new Error("Not implemented");
  }

  public open() {
    throw new Error("Not implemented");
  }

  public close() {
    throw new Error("Not implemented");
  }

  public hideErrorDetails() {
    throw new Error("Not implemented");
  }

  public resetData() {
    throw new Error("Not implemented");
  }

  public showErrorDetails() {
    throw new Error("Not implemented");
  }

  public onCloseKeyPress(source: any, event: KeyboardEvent): void {
    throw new Error("Not implemented");
  }

  public onPaneKeyDown(source: any, event: KeyboardEvent): boolean {
    throw new Error("Not implemented");
  }
}

export class AddCollectionPaneStub extends ContextualPaneStub implements ViewModels.AddCollectionPane {
  public collectionIdTitle: ko.Observable<string>;
  public databaseId: ko.Observable<string>;
  public partitionKey: ko.Observable<string>;
  public storage: ko.Observable<string>;
  public throughputSinglePartition: ko.Observable<number>;
  public throughputMultiPartition: ko.Observable<number>;
  public collectionMaxSharedThroughputTitle: ko.Observable<string>;
  public collectionWithThroughputInSharedTitle: ko.Observable<string>;

  public onEnableSynapseLinkButtonClicked() {
    throw new Error("Not implemented");
  }

  public onStorageOptionsKeyDown(source: any, event: KeyboardEvent): boolean {
    throw new Error("Not implemented");
  }

  public onRupmOptionsKeyDown(source: any, event: KeyboardEvent): void {
    throw new Error("Not implemented");
  }
}

export class AddDatabasePaneStub extends ContextualPaneStub implements ViewModels.AddDatabasePane {}

export class CassandraAddCollectionPane extends ContextualPaneStub implements ViewModels.CassandraAddCollectionPane {
  public createTableQuery: ko.Observable<string>;
  public keyspaceId: ko.Observable<string>;
  public userTableQuery: ko.Observable<string>;
}
