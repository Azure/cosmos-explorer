import * as DataModels from "../../../Contracts/DataModels";
import { parseConnectionString } from "./ConnectionStringParser";

describe("ConnectionStringParser", () => {
  const mockAccountName = "Test";
  const mockMasterKey = "some-key";

  it("should parse a valid sql account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.SQL);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBeUndefined();
  });

  it("should keep the document endpoint given by the connection string", () => {
    // The endpoint is taken from the connection string rather than rebuilt from the account name, so a
    // string that omits the port keeps it omitted.
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com/;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com/`);
  });

  it("should parse a valid mongo account connection string", () => {
    const metadata = parseConnectionString(
      `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.documents.azure.com:10255`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDB);
  });

  it("should parse a valid compute mongo account connection string", () => {
    const metadata = parseConnectionString(
      `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.mongo.cosmos.azure.com:10255`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDBCompute);
  });

  it("should parse a valid graph account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};ApiKind=Gremlin;`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Graph);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBe(`${mockAccountName}.gremlin.cosmos.azure.com:443`);
  });

  it("should parse a valid table account connection string", () => {
    const metadata = parseConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Table);
    // Tables data operations go through the document endpoint, which is constructed from the account name.
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBeUndefined();
  });

  it("should parse a valid table account connection string using the cosmos.azure.com zone", () => {
    const metadata = parseConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmos.azure.com:443/;`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Table);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBeUndefined();
  });

  it("should parse a valid cassandra account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=${mockAccountName}.cassandra.cosmosdb.azure.com;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Cassandra);
    // Cassandra still uses the Portal Backend proxy, so no client-side endpoints are constructed.
    expect(metadata.documentEndpoint).toBeUndefined();
    expect(metadata.apiEndpoint).toBeUndefined();
  });

  it("should fail to parse an invalid connection string", () => {
    const metadata = parseConnectionString("some-rogue-connection-string");

    expect(metadata).toBe(undefined);
  });

  it("should fail to parse an empty connection string", () => {
    const metadata = parseConnectionString("");

    expect(metadata).toBe(undefined);
  });
});
