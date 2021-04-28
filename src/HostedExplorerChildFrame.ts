import { AuthType } from "./AuthType";
import { AccessInputMetadata, DatabaseAccount } from "./Contracts/DataModels";

type HostedConfig = AAD | ConnectionString | EncryptedToken | ResourceToken;
export interface HostedExplorerChildFrame extends Window {
  hostedConfig: HostedConfig;
}

interface AADTokenAuth {
  aadToken: string;
}

export interface AAD extends AADTokenAuth {
  authType: AuthType.AAD;
  databaseAccount: DatabaseAccount;
  authorizationToken: string;
}

export interface ConnectionString extends AADTokenAuth {
  authType: AuthType.ConnectionString;
  // Connection string uses still use encrypted token for Cassandra/Mongo APIs as they us the portal backend proxy
  encryptedToken: string;
  encryptedTokenMetadata: AccessInputMetadata;
  // Master key is currently only used by Graph API. All other APIs use encrypted tokens and proxy with connection string
  masterKey?: string;
}

export interface EncryptedToken extends AADTokenAuth {
  authType: AuthType.EncryptedToken;
  encryptedToken: string;
  encryptedTokenMetadata: AccessInputMetadata;
}

export interface ResourceToken extends AADTokenAuth {
  authType: AuthType.ResourceToken;
  resourceToken: string;
}
