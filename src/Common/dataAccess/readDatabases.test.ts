jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");

import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readDatabases, readDatabasesWithARM } from "./readDatabases";

describe("readDatabases", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: "SQL",
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await readDatabases();
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      databases: {
        readAll: () => {
          return {
            fetchAll: (): unknown => [],
          };
        },
      },
    });
    await readDatabases();
    expect(client).toHaveBeenCalled();
  });
});

describe("readDatabasesWithARM (with accountOverride)", () => {
  const mockDatabase = { id: "testDb", _rid: "", _self: "", _etag: "", _ts: 0 };
  const mockArmResponse = { value: [{ properties: { resource: mockDatabase } }] };

  beforeAll(() => {
    updateUserContext({
      databaseAccount: { name: "context-account" } as DatabaseAccount,
      subscriptionId: "context-sub",
      resourceGroup: "context-rg",
      apiType: "SQL",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call ARM with a path that includes the provided subscriptionId, resourceGroup, and accountName", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({ subscriptionId: "test-sub", resourceGroup: "test-rg", accountName: "test-account" });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("/subscriptions/test-sub/resourceGroups/test-rg/"),
      }),
    );
    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("/databaseAccounts/test-account/sqlDatabases"),
      }),
    );
  });

  it("should use apiType from accountOverride when provided (SQL)", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account", apiType: "SQL" });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("/sqlDatabases") }),
    );
  });

  it("should use apiType from accountOverride when provided (Mongo)", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({
      subscriptionId: "sub",
      resourceGroup: "rg",
      accountName: "account",
      apiType: "Mongo",
    });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("/mongodbDatabases") }),
    );
  });

  it("should use apiType from accountOverride when provided (Cassandra)", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({
      subscriptionId: "sub",
      resourceGroup: "rg",
      accountName: "account",
      apiType: "Cassandra",
    });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("/cassandraKeyspaces") }),
    );
  });

  it("should use apiType from accountOverride when provided (Gremlin)", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({
      subscriptionId: "sub",
      resourceGroup: "rg",
      accountName: "account",
      apiType: "Gremlin",
    });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("/gremlinDatabases") }),
    );
  });

  it("should fall back to userContext.apiType when apiType is not in accountOverride", async () => {
    updateUserContext({ apiType: "Mongo" });
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account" });

    expect(armRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("/mongodbDatabases") }),
    );

    updateUserContext({ apiType: "SQL" }); // restore
  });

  it("should throw for unsupported apiType", async () => {
    await expect(
      readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account", apiType: "Tables" }),
    ).rejects.toThrow("Unsupported default experience type: Tables");
  });

  it("should return mapped database resources from the response", async () => {
    const db1 = { id: "db1", _rid: "r1", _self: "/dbs/db1", _etag: "", _ts: 1 };
    const db2 = { id: "db2", _rid: "r2", _self: "/dbs/db2", _etag: "", _ts: 2 };

    (armRequest as jest.Mock).mockResolvedValue({
      value: [{ properties: { resource: db1 } }, { properties: { resource: db2 } }],
    });

    const result = await readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account" });

    expect(result).toEqual([db1, db2]);
  });

  it("should return an empty array when the response is null", async () => {
    (armRequest as jest.Mock).mockResolvedValue(null);

    const result = await readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account" });

    expect(result).toEqual([]);
  });

  it("should return an empty array when value is an empty list", async () => {
    (armRequest as jest.Mock).mockResolvedValue({ value: [] });

    const result = await readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account" });

    expect(result).toEqual([]);
  });

  it("should throw and propagate errors from the ARM call", async () => {
    (armRequest as jest.Mock).mockRejectedValue(new Error("ARM request failed"));

    await expect(
      readDatabasesWithARM({ subscriptionId: "sub", resourceGroup: "rg", accountName: "account" }),
    ).rejects.toThrow("ARM request failed");
  });
});
