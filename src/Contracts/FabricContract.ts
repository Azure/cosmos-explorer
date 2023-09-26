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
  };

export type DataExploreMessage =
  | "ready"
  | {
    type: number;
    data: {
      action: "LoadDatabases";
      actionModifier: "success" | "start";
      defaultExperience: "SQL";
    };
  };
