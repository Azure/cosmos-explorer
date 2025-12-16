/**
 * Messaging types used with Data Explorer <-> Portal communication,
 * Hosted <-> Explorer communication
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * WARNING: !!!!!!! YOU CAN ONLY ADD NEW TYPES TO THE END OF THIS ENUM !!!!!!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Enum are integers, so inserting or deleting a type will break the communication.
 *
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
  DisplayNPSSurvey, // unused
  OpenVCoreMongoNetworkingBlade,
  OpenVCoreMongoConnectionStringsBlade,
  GetAuthorizationToken, // unused. Can be removed if the portal uses the same list of enums.
  GetAllResourceTokens, // unused. Can be removed if the portal uses the same list of enums.
  Ready, // unused. Can be removed if the portal uses the same list of enums.
  OpenCESCVAFeedbackBlade,
  ActivateTab,
  OpenContainerCopyFeedbackBlade,
  UpdateTheme,
}
