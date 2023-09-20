export type FabricMessage = {
    action: "newContainer";
    databaseName: string;
    collectionName: string;
} | {
    action: "initialize";
    connectionString: string;
};
