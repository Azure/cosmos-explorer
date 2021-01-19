import { AuthType } from "./AuthType";
import { AccessInputMetadata, DatabaseAccount } from "./Contracts/DataModels";

export interface HostedExplorerChildFrame extends Window {
  hostedConfig: AAD | ConnectionString | EncryptedToken | ResourceToken;
}

interface AAD {
  authType: AuthType.AAD;
  databaseAccount: DatabaseAccount;
  authorizationToken: string;
}

interface ConnectionString {
  authType: AuthType.ConnectionString;
  // Connection string uses still use encrypted token for Cassandra/Mongo APIs as they us the portal backend proxy
  encryptedToken: string;
  encryptedTokenMetadata: AccessInputMetadata;
  // Master key is currently only used by Graph API. All other APIs use encrypted tokens and proxy with connection string
  masterKey?: string;
}

interface EncryptedToken {
  authType: AuthType.EncryptedToken;
  encryptedToken: string;
  encryptedTokenMetadata: AccessInputMetadata;
}

interface ResourceToken {
  authType: AuthType.ResourceToken;
  resourceToken: string;
}
