import * as Versions from "./Versions";
import * as ActionContracts from "./ActionContracts";
import * as Diagnostics from "./Diagnostics";

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
  RefreshDatabaseAccount
}

export { Versions, ActionContracts, Diagnostics };
