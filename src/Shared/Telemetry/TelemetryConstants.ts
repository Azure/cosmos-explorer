/**
 * Defines constants related to logging telemetry.  This file should be kept in sync with the one in the portal extension code as much as possible.
 *
 * TODO: Move this to ExplorerContracts (265329)
 */
export class General {
  public static ExtensionName: string = "Microsoft_Azure_DocumentDB";
  public static BladeNamePrefix: string = "Extension/Microsoft_Azure_DocumentDB/Blade/";
}

/**
 * This is to be kept in sync with the one in portal. Please update the one in the portal if you add/remove any entry.
 */
export enum Action {
  CollapseTreeNode,
  CreateDatabaseAccount,
  CreateAzureFunction,
  CreateCollection,
  CreateDocument,
  CreateStoredProcedure,
  CreateTrigger,
  CreateUDF,
  DeleteCollection,
  DeleteDatabase,
  DeleteDocument,
  DownloadQuickstart,
  ExpandTreeNode,
  ExecuteQuery,
  HasFeature,
  GetVNETServices,
  InitializeAccountLocationFromResourceGroup,
  InitializeDataExplorer,
  LoadDatabaseAccount,
  LoadCollections,
  LoadDatabases,
  LoadMetrics,
  LoadOffers,
  LoadSingleCollectionWithOfferAndStatistics,
  MongoShell,
  OpenMetrics,
  ContextualPane,
  ScaleThroughput,
  SelectItem,
  SwitchQuickstartPlatform,
  Tab,
  UpdateDocument,
  UpdateRegions,
  UpdateSettings,
  UpdateStoredProcedure,
  UpdateTrigger,
  UpdateUDF,
  ViewWarning,
  LoadBlade,
  LoadResourceTree,
  LoadMetricsTab,
  AccountLevelThroughput,
  CreateDatabase,
  ResolveConflict,
  DeleteConflict,
  SaveQuery,
  SetupSavedQueries,
  LoadSavedQuery,
  DeleteSavedQuery,
  ConnectEncryptionToken,
  SignInAad,
  SignOutAad,
  FetchTenants,
  FetchSubscriptions,
  FetchAccounts,
  GetAccountKeys,
  LoadingStatus,
  AccountSwitch,
  SubscriptionSwitch,
  TenantSwitch,
  DefaultTenantSwitch,
  ResetNotebookWorkspace,
  CreateNotebookWorkspace,
  NotebookErrorNotification,
  CreateSparkCluster,
  UpdateSparkCluster,
  DeleteSparkCluster,
  LibraryManage,
  ClusterLibraryManage,
  ModifyOptionForThroughputWithSharedDatabase,
  EnableAzureSynapseLink,
  CreateNewNotebook,
  OpenSampleNotebook,
  ExecuteCell,
  ExecuteCellPromptBtn,
  ExecuteAllCells,
  NotebookEnabled,
  NotebooksGitHubConnect,
  NotebooksGitHubAuthorize,
  NotebooksGitHubManualRepoAdd,
  NotebooksGitHubManageRepo,
  NotebooksGitHubCommit,
  NotebooksGitHubDisconnect
}

export class ActionModifiers {
  public static Start: string = "start";
  public static Success: string = "success";
  public static Failed: string = "failed";
  public static Mark: string = "mark";
  public static Open: string = "open";
  public static IFrameReady: string = "iframeready";
  public static Close: string = "close";
  public static Submit: string = "submit";
  public static IndexAll: string = "index all properties";
  public static NoIndex: string = "no indexing";
  public static Cancel: string = "cancel";
}

export class CosmosDBEndpointNames {
  public static Gateway: string = "CosmosDBGateway";
  public static ResourceProvider: string = "DocumentDBResourceProvider";
}

export enum SourceBlade {
  AddCollection,
  AzureFunction,
  BrowseCollectionBlade,
  CassandraAccountCreateBlade,
  CollectionSetting,
  DatabaseAccountCreateBlade,
  DataExplorer,
  DeleteCollection,
  DeleteDatabase,
  DocumentExplorer,
  FirewallVNETBlade,
  Metrics,
  NonDocumentDBAccountCreateBlade,
  OverviewBlade,
  QueryExplorer,
  Quickstart,
  ReaderWarning,
  ResourceMenu,
  RpcProvider,
  ScaleCollection,
  ScriptExplorer,
  Keys
}

export class BladeLoadRequirements {
  public static collections: string = "Collections";
  public static collectionsWithOffers: string = "CollectionsWithOffers";
  public static databaseAccount: string = "DatabaseAccount";
  public static keys: string = "Keys";
  public static metrics: string = "Metrics";
  public static notifications: string = "Notifications";
  public static singleCollection: string = "SingleCollection";

  public static keysBlade: string[] = [BladeLoadRequirements.databaseAccount, BladeLoadRequirements.keys];
  public static metricsBlade: string[] = [BladeLoadRequirements.databaseAccount];
  public static overview: string[] = [BladeLoadRequirements.databaseAccount, BladeLoadRequirements.notifications];
}
