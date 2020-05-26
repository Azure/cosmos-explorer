import * as DataModels from "../../../Contracts/DataModels";
import { ConnectionStringParser } from "./ConnectionStringParser";

describe("ConnectionStringParser", () => {
  const mockAccountName: string = "Test";
  const mockMasterKey: string = "some-key";

  it("should parse a valid sql account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.SQL);
  });

  it("should parse a valid mongo account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.documents.azure.com:10255`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDB);
  });

  it("should parse a valid compute mongo account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.mongo.cosmos.azure.com:10255`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDBCompute);
  });

  it("should parse a valid graph account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};ApiKind=Gremlin;`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Graph);
  });

  it("should parse a valid table account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Table);
  });

  it("should parse a valid cassandra account connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      `AccountEndpoint=${mockAccountName}.cassandra.cosmosdb.azure.com;AccountKey=${mockMasterKey};`
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Cassandra);
  });

  it("should fail to parse an invalid connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      "some-rogue-connection-string"
    );

    expect(metadata).toBe(undefined);
  });

  it("should fail to parse an empty connection string", () => {
    const metadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString("");

    expect(metadata).toBe(undefined);
  });
});
