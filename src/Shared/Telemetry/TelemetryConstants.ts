/**
 * Defines constants related to logging telemetry. Everything except Action should be kept in sync with the one in the Portal code as much as possible.
 *
 * TODO: Move this to ExplorerContracts (265329)
 */
export class General {
  public static ExtensionName: string = "Microsoft_Azure_DocumentDB";
  public static BladeNamePrefix: string = "Extension/Microsoft_Azure_DocumentDB/Blade/";
}

// Data Explorer specific actions. No need to keep this in sync with the one in Portal.
export enum Action {
  CollapseTreeNode,
  CreateCollection,
  CreateDocument,
  CreateStoredProcedure,
  CreateTrigger,
  CreateUDF,
  DeleteCollection,
  DeleteDatabase,
  DeleteDocument,
  ExpandTreeNode,
  ExecuteQuery,
  HasFeature,
  GetVNETServices,
  InitializeAccountLocationFromResourceGroup,
  InitializeDataExplorer,
  LoadDatabaseAccount,
  LoadCollections,
  LoadDatabases,
  LoadOffers,
  MongoShell,
  ContextualPane,
  ScaleThroughput,
  SelectItem,
  Tab,
  UpdateDocument,
  UpdateSettings,
  UpdateStoredProcedure,
  UpdateTrigger,
  UpdateUDF,
  LoadResourceTree,
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
  NotebooksGitHubDisconnect,
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
  Keys,
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
