import { AuthorizationToken } from "./FabricMessageTypes";

// This is the version of these messages
export const FABRIC_RPC_VERSION = "FabricMessageV3";

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
        data: ResourceTokenInfo | undefined;
      };
    }
  | {
      type: "explorerVisible";
      message: {
        visible: boolean;
      };
    };

export type FabricMessageV3 =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize";
      version: string;
      id: string;
      message: InitializeMessageV3<CosmosDbArtifactType>;
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
        data: ResourceTokenInfo | undefined;
      };
    }
  | {
      type: "explorerVisible";
      message: {
        visible: boolean;
      };
    }
  | {
      type: "accessToken";
      message: {
        id: string;
        error: string | undefined;
        data: { accessToken: string };
      };
    }
  | {
      type: "refreshResourceTree";
    }
  | {
      type: "shortcutCreated";
      message: {
        shortcutId: string;
      };
    };

export enum CosmosDbArtifactType {
  MIRRORED_KEY = "MIRRORED_KEY",
  MIRRORED_AAD = "MIRRORED_AAD",
  NATIVE = "NATIVE",
}
export interface ArtifactConnectionInfo {
  [CosmosDbArtifactType.MIRRORED_KEY]: { connectionId: string };
  [CosmosDbArtifactType.MIRRORED_AAD]: AccessTokenConnectionInfo;
  [CosmosDbArtifactType.NATIVE]: AccessTokenConnectionInfo;
}

export interface AccessTokenConnectionInfo {
  accessToken: string;
  databaseName: string;
  accountEndpoint: string;
}

export interface InitializeMessageV3<T extends CosmosDbArtifactType> {
  connectionId: string;
  isVisible: boolean;
  isReadOnly: boolean;
  artifactType: T;
  artifactConnectionInfo: ArtifactConnectionInfo[T];
}
export interface CosmosDBConnectionInfoResponse {
  endpoint: string;
  databaseId: string;
  resourceTokens: Record<string, string> | undefined;
  accessToken: string | undefined;
  isReadOnly: boolean;
  credentialType: "Key" | "OAuth2" | undefined;
}

export interface ResourceTokenInfo extends CosmosDBConnectionInfoResponse {
  resourceTokensTimestamp: number;
}
