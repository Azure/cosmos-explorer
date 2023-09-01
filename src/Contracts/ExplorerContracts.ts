import * as ActionContracts from "./ActionContracts";
import * as Diagnostics from "./Diagnostics";
import * as Versions from "./Versions";

/**
 * Messaging types used with Data Explorer <-> Portal communication
 * and Hosted <-> Explorer communication
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
}

export { ActionContracts, Diagnostics, Versions };

