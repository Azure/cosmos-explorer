export type FabricMessage =
  | {
      type: "newContainer";
      databaseName: string;
    }
  | {
      type: "initialize";
      connectionString: string;
      openDatabaseName?: string; // optional Database name to open
    }
  | {
      type: "openTab";
      databaseName: string;
      collectionName: string;
    };

export type DataExploreMessage = "ready";
