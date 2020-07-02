import Main from "./Main";

describe("Main", () => {
  it("correctly detects feature flags", () => {
    // Search containing non-features, with Camelcase keys and uri encoded values
    const params = new URLSearchParams(
      "?platform=Hosted&feature.notebookserverurl=https%3A%2F%2Flocalhost%3A10001%2F12345%2Fnotebook&feature.notebookServerToken=token&feature.enablenotebooks=true&key=mykey"
    );
    const features = Main.extractFeatures(params);

    expect(features).toEqual({
      notebookserverurl: "https://localhost:10001/12345/notebook",
      notebookservertoken: "token",
      enablenotebooks: "true",
    });
  });

  it("correctly parses resource token connection string", () => {
    const connectionString =
      "AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;";
    const properties = Main.parseResourceTokenConnectionString(connectionString);

    expect(properties).toEqual({
      accountEndpoint: "fakeEndpoint",
      collectionId: "fakeCollectionId",
      databaseId: "fakeDatabaseId",
      partitionKey: undefined,
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;",
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
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;",
    });
  });
});
