import { AuthType } from "./AuthType";
import { AccessInputMetadata, DatabaseAccount } from "./Contracts/DataModels";

type HostedConfig = AAD | ConnectionString | EncryptedToken | ResourceToken;
export interface HostedExplorerChildFrame extends Window {
  hostedConfig: HostedConfig;
}

export interface AAD {
  authType: AuthType.AAD;
  databaseAccount: DatabaseAccount;
  authorizationToken: string;
}

export interface ConnectionString {
  authType: AuthType.ConnectionString;
  // SQL, Tables, and Gremlin sign data-plane requests client-side with the master key and do not need the
  // Portal Backend proxy, so they carry no encrypted token. Mongo and Cassandra still use the encrypted
  // token because their operations go through the Portal Backend proxy.
  encryptedToken?: string;
  encryptedTokenMetadata: AccessInputMetadata;
  // Master key is used for the client-side signing path (SQL, Tables, Gremlin). Mongo/Cassandra leave it undefined.
  masterKey?: string;
}

export interface EncryptedToken {
  authType: AuthType.EncryptedToken;
  encryptedToken: string;
  encryptedTokenMetadata: AccessInputMetadata;
}

export interface ResourceToken {
  authType: AuthType.ResourceToken;
  resourceToken: string;
}
