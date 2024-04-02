/**
 * Messaging types used with Data Explorer <-> Portal communication,
 * Hosted <-> Explorer communication and Data Explorer -> Fabric communication.
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * WARNING: !!!!!!! YOU CAN ONLY ADD NEW TYPES TO THE END OF THIS ENUM !!!!!!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Enum are integers, so inserting or deleting a type will break the communication.
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
  ActivateTab,
  CloseTab,
  OpenQuickstartBlade,
  OpenPostgreSQLPasswordReset,
  OpenPostgresNetworkingBlade,
  OpenCosmosDBNetworkingBlade,
  DisplayNPSSurvey,
  OpenVCoreMongoNetworkingBlade,
  OpenVCoreMongoConnectionStringsBlade,
  GetAuthorizationToken, // Data Explorer -> Fabric
  GetAllResourceTokens, // Data Explorer -> Fabric
  Ready, // Data Explorer -> Fabric
  OpenCESCVAFeedbackBlade,
}

export interface AuthorizationToken {
  XDate: string;
  PrimaryReadWriteToken: string;
}
