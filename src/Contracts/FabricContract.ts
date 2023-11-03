import { AuthorizationToken, MessageTypes } from "./MessageTypes";

// Fabric to Data Explorer
export type FabricMessage =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize";
      message: {
        connectionId: string;
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
        data: FabricDatabaseConnectionInfo | undefined;
      };
    };

// Data Explorer to Fabric
export type DataExploreMessage =
  | "ready"
  | {
      type: MessageTypes.GetAuthorizationToken;
      id: string;
      params: GetCosmosTokenMessageOptions[];
    }
  | {
      type: MessageTypes.GetAllResourceTokens;
      id: string;
    };

export type GetCosmosTokenMessageOptions = {
  verb: "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";
  resourceType: "" | "dbs" | "colls" | "docs" | "sprocs" | "pkranges";
  resourceId: string;
};

export type CosmosDBTokenResponse = {
  token: string;
  date: string;
};

export type CosmosDBConnectionInfoResponse = {
  endpoint: string;
  databaseId: string;
  resourceTokens: unknown;
};

export interface FabricDatabaseConnectionInfo {
  endpoint: string;
  databaseId: string;
  resourceTokens: { [resourceId: string]: string };
  resourceTokensTimestamp: number;
}
