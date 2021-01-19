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
  ToggleAutoscaleSetting,
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
  NotebooksFetched,
  NotebooksKernelSpecName,
  NotebooksExecuteCellFromMenu,
  NotebooksClearOutputsFromMenu,
  NotebooksInsertCodeCellAboveFromMenu,
  NotebooksInsertCodeCellBelowFromMenu,
  NotebooksInsertTextCellAboveFromMenu,
  NotebooksInsertTextCellBelowFromMenu,
  NotebooksMoveCellUpFromMenu,
  NotebooksMoveCellDownFromMenu,
  DeleteCellFromMenu,
  OpenTerminal,
  CreateMongoCollectionWithWildcardIndex,
  ClickCommandBarButton,
  RefreshResourceTreeMyNotebooks,
  ClickResourceTreeNodeContextMenuItem,
  DiscardSettings,
  SettingsV2Updated,
  SettingsV2Discarded,
  MongoIndexUpdated
}

export const ActionModifiers = {
  Start: "start",
  Success: "success",
  Failed: "failed",
  Mark: "mark",
  Open: "open",
  IFrameReady: "iframeready",
  Close: "close",
  Submit: "submit",
  IndexAll: "index all properties",
  NoIndex: "no indexing",
  Cancel: "cancel",
  ToggleAutoscaleOn: "autoscale on",
  ToggleAutoscaleOff: "autoscale off"
} as const;

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
