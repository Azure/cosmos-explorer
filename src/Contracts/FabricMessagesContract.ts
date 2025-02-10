import { AuthorizationToken } from "./FabricMessageTypes";

// This is the version of these messages
export const FABRIC_RPC_VERSION = "2";

// Fabric to Data Explorer
export type FabricMessageV2 =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize";
      version: string;
      id: string;
      message: {
        connectionId: string;
        isVisible: boolean;
        isReadOnly: boolean;
        artifactType: CosmosDbArtifactType;

        // For Native artifacts
        nativeConnectionInfo?: FabricNativeDatabaseConnectionInfo;
      };
    }
  | {
      type: "authorizationToken";
      message: {
        id: string;
        error: string | undefined;
        data: AuthorizationToken | undefined;
      };
    }
  | {
      type: "allResourceTokens_v2";
      message: {
        id: string;
        error: string | undefined;
        data: FabricMirroredDatabaseConnectionInfo | undefined;
      };
    }
  | {
      type: "explorerVisible";
      message: {
        visible: boolean;
      };
    };

export enum CosmosDbArtifactType {
  MIRRORED = "MIRRORED",
  NATIVE = "NATIVE",
}

export interface FabricNativeDatabaseConnectionInfo {
  accessToken: string;
  databaseName: string;
  accountEndpoint: string;
}

export interface CosmosDBTokenResponse {
  token: string;
  date: string;
}

export interface CosmosDBConnectionInfoResponse {
  endpoint: string;
  databaseId: string;
  resourceTokens: Record<string, string>;
}

export interface FabricMirroredDatabaseConnectionInfo extends CosmosDBConnectionInfoResponse {
  resourceTokensTimestamp: number;
}
