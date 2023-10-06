import { AuthorizationToken, MessageTypes } from "./MessageTypes";

export type FabricMessage =
  | {
    type: "newContainer";
    databaseName: string;
  }
  | {
    type: "initialize";
    connectionString: string | undefined;
  }
  | {
    type: "openTab";
    databaseName: string;
    collectionName: string | undefined;
  }
  | {
    type: "authorizationToken";
    message: {
      id: string;
      error: string | undefined;
      data: AuthorizationToken;
    }
  };

export type DataExploreMessage =
  | "ready"
  | {
    type: MessageTypes.TelemetryInfo;
    data: {
      action: "LoadDatabases";
      actionModifier: "success" | "start";
      defaultExperience: "SQL";
    };
  }
  | {
    type: MessageTypes.GetAuthorizationToken;
    id: string;
    params: [{
      verb: string;
      resourceId: string;
      resourceType: string;
      headers: {
        [key: string]: string;
      }
    }];
  };
