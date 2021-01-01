import Main from "./Main";

describe("Main", () => {
  it("correctly parses resource token connection string", () => {
    const connectionString =
      "AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;";
    const properties = Main.parseResourceTokenConnectionString(connectionString);

    expect(properties).toEqual({
      accountEndpoint: "fakeEndpoint",
      collectionId: "fakeCollectionId",
      databaseId: "fakeDatabaseId",
      partitionKey: undefined,
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;"
    });
  });

  it("correctly parses resource token connection string with partition key", () => {
    const connectionString =
      "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;PartitionKey=fakePartitionKey;";
    const properties = Main.parseResourceTokenConnectionString(connectionString);

    expect(properties).toEqual({
      accountEndpoint: "fakeEndpoint",
      collectionId: "fakeCollectionId",
      databaseId: "fakeDatabaseId",
      partitionKey: "fakePartitionKey",
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;"
    });
  });
});
