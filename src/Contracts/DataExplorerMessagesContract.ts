import { MessageTypes } from "./MessageTypes";

// This is the current version of these messages
export const DATA_EXPLORER_RPC_VERSION = "2";

// Data Explorer to Fabric

// TODO Remove when upgrading to Fabric v2
export type DataExploreMessageV1 =
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
// -----------------------------

export type DataExploreMessageV2 =
  | {
      type: MessageTypes.Ready;
      id: string;
      params: [string]; // version
    }
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
