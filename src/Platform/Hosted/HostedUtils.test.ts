import { AccessInputMetadata, ApiKind } from "../../Contracts/DataModels";
import {
  extractMasterKeyfromConnectionString,
  getDatabaseAccountPropertiesFromMetadata,
  isDirectConnectionStringLoginApi,
} from "./HostedUtils";

describe("getDatabaseAccountPropertiesFromMetadata", () => {
  it("should only return an object with the mongoEndpoint key if the apiKind is mongoCompute (5)", () => {
    const mongoComputeAccount: AccessInputMetadata = {
      accountName: "compute-batch2",
      apiEndpoint: "compute-batch2.mongo.cosmos.azure.com:10255",
      apiKind: 5,
      documentEndpoint: "https://compute-batch2.documents.azure.com:443/",
      expiryTimestamp: "1234",
      mongoEndpoint: "https://compute-batch2.mongo.cosmos.azure.com:443/",
    };
    expect(getDatabaseAccountPropertiesFromMetadata(mongoComputeAccount)).toEqual({
      mongoEndpoint: mongoComputeAccount.mongoEndpoint,
      documentEndpoint: mongoComputeAccount.documentEndpoint,
    });
  });

  it("should not return an object with the mongoEndpoint key if the apiKind is mongo (1)", () => {
    const mongoAccount: AccessInputMetadata = {
      accountName: "compute-batch2",
      apiEndpoint: "compute-batch2.mongo.cosmos.azure.com:10255",
      apiKind: 1,
      documentEndpoint: "https://compute-batch2.documents.azure.com:443/",
      expiryTimestamp: "1234",
    };
    expect(getDatabaseAccountPropertiesFromMetadata(mongoAccount)).toEqual({
      documentEndpoint: mongoAccount.documentEndpoint,
    });
  });
});

describe("extractMasterKeyfromConnectionString", () => {
  const mockAccountName = "Test";
  const mockKey = "abc123+/=someKey==";

  it("extracts the account key from a SQL connection string", () => {
    expect(
      extractMasterKeyfromConnectionString(
        `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockKey};`,
      ),
    ).toBe(mockKey);
  });

  it("extracts the account key from a Table connection string", () => {
    expect(
      extractMasterKeyfromConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`,
      ),
    ).toBe(mockKey);
  });

  it("extracts the account key from a Gremlin connection string", () => {
    expect(
      extractMasterKeyfromConnectionString(
        `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockKey};ApiKind=Gremlin;`,
      ),
    ).toBe(mockKey);
  });

  it("returns undefined when there is no account key", () => {
    expect(
      extractMasterKeyfromConnectionString(`AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;`),
    ).toBeUndefined();
  });

  it("returns undefined for an empty connection string", () => {
    expect(extractMasterKeyfromConnectionString("")).toBeUndefined();
  });
});

describe("isDirectConnectionStringLoginApi", () => {
  it("returns true for SQL, Table, and Graph", () => {
    expect(isDirectConnectionStringLoginApi(ApiKind.SQL)).toBe(true);
    expect(isDirectConnectionStringLoginApi(ApiKind.Table)).toBe(true);
    expect(isDirectConnectionStringLoginApi(ApiKind.Graph)).toBe(true);
  });

  it("returns false for Mongo and Cassandra, which require the Portal Backend proxy", () => {
    expect(isDirectConnectionStringLoginApi(ApiKind.MongoDB)).toBe(false);
    expect(isDirectConnectionStringLoginApi(ApiKind.MongoDBCompute)).toBe(false);
    expect(isDirectConnectionStringLoginApi(ApiKind.Cassandra)).toBe(false);
  });
});
