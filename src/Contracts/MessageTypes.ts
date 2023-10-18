/**
 * Messaging types used with Data Explorer <-> Portal communication,
 * Hosted <-> Explorer communication and Data Explorer -> Fabric communication.
 */
export enum MessageTypes {
  TelemetryInfo,
  LogInfo,
  RefreshResources,
  AllDatabases,
  CollectionsForDatabase,
  RefreshOffers,
  AllOffers,
  UpdateLocationHash,
  SingleOffer,
  RefreshOffer,
  UpdateAccountName,
  ForbiddenError,
  AadSignIn,
  GetAccessAadRequest,
  GetAccessAadResponse,
  UpdateAccountSwitch,
  UpdateDirectoryControl,
  SwitchAccount,
  SendNotification,
  ClearNotification,
  ExplorerClickEvent,
  LoadingStatus,
  GetArcadiaToken,
  CreateWorkspace,
  CreateSparkPool,
  RefreshDatabaseAccount,
  CloseTab,
  OpenQuickstartBlade,
  OpenPostgreSQLPasswordReset,
  OpenPostgresNetworkingBlade,
  OpenCosmosDBNetworkingBlade,
  DisplayNPSSurvey,
  OpenVCoreMongoNetworkingBlade,
  OpenVCoreMongoConnectionStringsBlade,

  // Data Explorer -> Fabric communication
  GetAuthorizationToken,
  GetAllResourceTokens
}

export interface AuthorizationToken {
  XDate: string;
  PrimaryReadWriteToken: string;
}
