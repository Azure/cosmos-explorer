import { AccessInputMetadata, ApiKind } from "../../Contracts/DataModels";
import {
  extractAccountKeyFromConnectionString,
  extractEndpointHostFromConnectionString,
  getDatabaseAccountPropertiesFromMetadata,
  isDirectConnectionStringLoginApi,
  validateDirectConnectionStringLogin,
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

describe("extractAccountKeyFromConnectionString", () => {
  const mockAccountName = "Test";
  const mockKey = "abc123+/=someKey==";

  it("extracts the account key from a SQL connection string", () => {
    expect(
      extractAccountKeyFromConnectionString(
        `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockKey};`,
      ),
    ).toBe(mockKey);
  });

  it("extracts the account key from a Table connection string", () => {
    expect(
      extractAccountKeyFromConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`,
      ),
    ).toBe(mockKey);
  });

  it("extracts the account key from a Gremlin connection string", () => {
    expect(
      extractAccountKeyFromConnectionString(
        `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockKey};ApiKind=Gremlin;`,
      ),
    ).toBe(mockKey);
  });

  it("returns undefined when there is no account key", () => {
    expect(
      extractAccountKeyFromConnectionString(`AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;`),
    ).toBeUndefined();
  });

  it("returns undefined for an empty connection string", () => {
    expect(extractAccountKeyFromConnectionString("")).toBeUndefined();
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

describe("extractEndpointHostFromConnectionString", () => {
  it("extracts the host from a SQL/Gremlin AccountEndpoint", () => {
    expect(
      extractEndpointHostFromConnectionString(
        "AccountEndpoint=https://my-account.documents.azure.com:443/;AccountKey=key==;",
      ),
    ).toBe("my-account.documents.azure.com");
  });

  it("extracts the host from a Table TableEndpoint", () => {
    expect(
      extractEndpointHostFromConnectionString(
        "DefaultEndpointsProtocol=https;AccountName=my-account;AccountKey=key==;TableEndpoint=https://my-account.table.cosmos.azure.com:443/;",
      ),
    ).toBe("my-account.table.cosmos.azure.com");
  });

  it("returns undefined when no endpoint host is present", () => {
    expect(extractEndpointHostFromConnectionString("AccountName=my-account;AccountKey=key==;")).toBeUndefined();
  });
});

describe("validateDirectConnectionStringLogin", () => {
  const mockKey = "abc123+/=someKey==";
  const sqlMetadata = { accountName: "my-account", apiKind: ApiKind.SQL } as AccessInputMetadata;
  const tableMetadata = { accountName: "my-account", apiKind: ApiKind.Table } as AccessInputMetadata;
  const gremlinMetadata = { accountName: "my-account", apiKind: ApiKind.Graph } as AccessInputMetadata;

  it("returns undefined for a valid SQL connection string", () => {
    const connectionString = `AccountEndpoint=https://my-account.documents.azure.com:443/;AccountKey=${mockKey};`;
    expect(validateDirectConnectionStringLogin(connectionString, sqlMetadata)).toBeUndefined();
  });

  it("returns undefined for a valid Table connection string using the cosmos.azure.com zone", () => {
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=my-account;AccountKey=${mockKey};TableEndpoint=https://my-account.table.cosmos.azure.com:443/;`;
    expect(validateDirectConnectionStringLogin(connectionString, tableMetadata)).toBeUndefined();
  });

  it("returns undefined for a valid Gremlin connection string", () => {
    const connectionString = `AccountEndpoint=https://my-account.documents.azure.com:443/;AccountKey=${mockKey};ApiKind=Gremlin;`;
    expect(validateDirectConnectionStringLogin(connectionString, gremlinMetadata)).toBeUndefined();
  });

  it("rejects an empty connection string", () => {
    expect(validateDirectConnectionStringLogin("", {} as AccessInputMetadata)).toBe("Connection string is missing.");
  });

  it("rejects when the account name is missing from metadata", () => {
    const connectionString = `AccountEndpoint=https://my-account.documents.azure.com:443/;AccountKey=${mockKey};`;
    expect(validateDirectConnectionStringLogin(connectionString, {} as AccessInputMetadata)).toBe(
      "Account name is missing from the connection string.",
    );
  });

  it("rejects a host that is not in an allowlisted zone", () => {
    // Point the endpoint host at an untrusted zone while keeping a valid parsed account name.
    const tamperedConnectionString = `AccountEndpoint=https://my-account.evil.example.com:443/;AccountKey=${mockKey};`;
    expect(validateDirectConnectionStringLogin(tamperedConnectionString, sqlMetadata)).toBe(
      "Endpoint host is not allowed.",
    );
  });

  it("rejects when the account name does not match the endpoint host label", () => {
    const connectionString = `AccountEndpoint=https://real-account.documents.azure.com:443/;AccountKey=${mockKey};`;
    const metadata = { accountName: "different-account", apiKind: ApiKind.SQL } as AccessInputMetadata;
    expect(validateDirectConnectionStringLogin(connectionString, metadata)).toBe(
      "Account name does not match the endpoint host.",
    );
  });

  it("rejects when the account key is missing", () => {
    const connectionString = "AccountEndpoint=https://my-account.documents.azure.com:443/;";
    const metadata = { accountName: "my-account", apiKind: ApiKind.SQL } as AccessInputMetadata;
    expect(validateDirectConnectionStringLogin(connectionString, metadata)).toBe(
      "Account key is missing from the connection string.",
    );
  });
});
