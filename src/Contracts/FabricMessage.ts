export type FabricMessage =
  | {
      type: "newContainer";
      databaseName: string;
      collectionName: string;
    }
  | {
      type: "initialize";
      connectionString: string;
    };
