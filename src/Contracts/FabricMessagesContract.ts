import { AuthorizationToken } from "./MessageTypes";

// This is the version of these messages
export const FABRIC_RPC_VERSION = "2";

// Fabric to Data Explorer

// TODO Deprecated. Remove this section once DE is updated
export type FabricMessageV1 =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize";
      message: {
        endpoint: string | undefined;
        databaseId: string | undefined;
        resourceTokens: unknown | undefined;
        resourceTokensTimestamp: number | undefined;
        error: string | undefined;
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
      type: "allResourceTokens";
      message: {
        id: string;
        error: string | undefined;
        endpoint: string | undefined;
        databaseId: string | undefined;
        resourceTokens: unknown | undefined;
        resourceTokensTimestamp: number | undefined;
      };
    };
// -----------------------------

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
        data: FabricDatabaseConnectionInfo | undefined;
      };
    }
  | {
      type: "explorerVisible";
      message: {
        visible: boolean;
      };
    };

export type CosmosDBTokenResponse = {
  token: string;
  date: string;
};

export type CosmosDBConnectionInfoResponse = {
  endpoint: string;
  databaseId: string;
  resourceTokens: { [resourceId: string]: string };
};

export interface FabricDatabaseConnectionInfo extends CosmosDBConnectionInfoResponse {
  resourceTokensTimestamp: number;
}
