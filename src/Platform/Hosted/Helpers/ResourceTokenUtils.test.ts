import { isResourceTokenConnectionString, parseResourceTokenConnectionString } from "./ResourceTokenUtils";

describe("parseResourceTokenConnectionString", () => {
  it("correctly parses resource token connection string", () => {
    const connectionString =
      "AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;";
    const properties = parseResourceTokenConnectionString(connectionString);

    expect(properties).toEqual({
      accountEndpoint: "fakeEndpoint",
      collectionId: "fakeCollectionId",
      databaseId: "fakeDatabaseId",
      partitionKey: "",
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;",
    });
  });

  it("correctly parses resource token connection string with partition key", () => {
    const connectionString =
      "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;PartitionKey=fakePartitionKey;";
    const properties = parseResourceTokenConnectionString(connectionString);

    expect(properties).toEqual({
      accountEndpoint: "fakeEndpoint",
      collectionId: "fakeCollectionId",
      databaseId: "fakeDatabaseId",
      partitionKey: "fakePartitionKey",
      resourceToken: "type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;",
    });
  });
});

describe("isResourceToken", () => {
  it("valid resource connection string", () => {
    const connectionString =
      "AccountEndpoint=fakeEndpoint;DatabaseId=fakeDatabaseId;CollectionId=fakeCollectionId;type=resource&ver=1&sig=2dIP+CdIfT1ScwHWdv5GGw==;fakeToken;";
    expect(isResourceTokenConnectionString(connectionString)).toBe(true);
  });

  it("non-resource connection string", () => {
    const connectionString = "AccountEndpoint=https://stfaul-sql.documents.azure.com:443/;AccountKey=foo;";
    expect(isResourceTokenConnectionString(connectionString)).toBe(false);
  });
});
