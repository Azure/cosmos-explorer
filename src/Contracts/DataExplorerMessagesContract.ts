import { FabricMessageTypes } from "./FabricMessageTypes";

// This is the current version of these messages
export const DATA_EXPLORER_RPC_VERSION = "3";

// Data Explorer to Fabric
export type DataExploreMessageV3 =
  | {
      type: FabricMessageTypes.Ready;
      id: string;
      params: [string]; // version
    }
  | {
      type: FabricMessageTypes.GetAuthorizationToken;
      id: string;
      params: GetCosmosTokenMessageOptions[];
    }
  | {
      type: FabricMessageTypes.GetAllResourceTokens;
      id: string;
    };

export type GetCosmosTokenMessageOptions = {
  verb: "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";
  resourceType: "" | "dbs" | "colls" | "docs" | "sprocs" | "pkranges";
  resourceId: string;
};
