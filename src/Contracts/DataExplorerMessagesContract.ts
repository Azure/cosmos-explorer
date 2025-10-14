import { FabricMessageTypes } from "./FabricMessageTypes";
import { MessageTypes } from "./MessageTypes";

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
    }
  | {
      type: FabricMessageTypes.GetAccessToken;
      id: string;
    }
  | {
      type: MessageTypes.TelemetryInfo;
      data: {
        action: string;
        actionModifier: string;
        data: unknown;
        timestamp: number;
      };
    }
  | {
      type: FabricMessageTypes.OpenSettings;
      params: [{ settingsId?: "About" | "Connection" }];
    }
  | {
      type: FabricMessageTypes.RestoreContainer;
      params: [];
    }
  | {
      type: FabricMessageTypes.ContainerUpdated;
      params: {
        updateType: "created" | "deleted" | "settings";
      };
    }
  | {
      type: FabricMessageTypes.RestoreContainer;
      params: [];
    };
export interface GetCosmosTokenMessageOptions {
  verb: "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";
  resourceType: "" | "dbs" | "colls" | "docs" | "sprocs" | "pkranges";
  resourceId: string;
}
