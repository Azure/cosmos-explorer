import { AuthorizationToken, MessageTypes } from "./MessageTypes";

// Fabric to Data Explorer
export type FabricMessage =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize_fabric2";
      message: {
        connectionId: string;
      };
    }
  | {
      // TODO Deprecated. Remove this section once DE is updated
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
      type: "allResourceTokens_fabric2";
      message: {
        id: string;
        error: string | undefined;
        data: FabricDatabaseConnectionInfo | undefined;
      };
    }
  | {
      // TODO Deprecated. Remove this section once DE is updated
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

// Data Explorer to Fabric
export type DataExploreMessage =
  | "ready"
  | "ready_fabric2"
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
  resourceTokens: { [resourceId: string]: string };
};

export interface FabricDatabaseConnectionInfo extends CosmosDBConnectionInfoResponse {
  resourceTokensTimestamp: number;
}
