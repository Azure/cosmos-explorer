jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");

import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readDatabases, readDatabasesForAccount } from "./readDatabases";

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

describe("readDatabasesForAccount", () => {
  const mockDatabase = { id: "testDb", _rid: "", _self: "", _etag: "", _ts: 0 };
  const mockArmResponse = { value: [{ properties: { resource: mockDatabase } }] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call ARM with a path that includes the provided subscriptionId, resourceGroup, and accountName", async () => {
    (armRequest as jest.Mock).mockResolvedValue(mockArmResponse);

    await readDatabasesForAccount("test-sub", "test-rg", "test-account");

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

  it("should return mapped database resources from the response", async () => {
    const db1 = { id: "db1", _rid: "r1", _self: "/dbs/db1", _etag: "", _ts: 1 };
    const db2 = { id: "db2", _rid: "r2", _self: "/dbs/db2", _etag: "", _ts: 2 };

    (armRequest as jest.Mock).mockResolvedValue({
      value: [{ properties: { resource: db1 } }, { properties: { resource: db2 } }],
    });

    const result = await readDatabasesForAccount("sub", "rg", "account");

    expect(result).toEqual([db1, db2]);
  });

  it("should return an empty array when the response is null", async () => {
    (armRequest as jest.Mock).mockResolvedValue(null);

    const result = await readDatabasesForAccount("sub", "rg", "account");

    expect(result).toEqual([]);
  });

  it("should return an empty array when value is an empty list", async () => {
    (armRequest as jest.Mock).mockResolvedValue({ value: [] });

    const result = await readDatabasesForAccount("sub", "rg", "account");

    expect(result).toEqual([]);
  });

  it("should throw and propagate errors from the ARM call", async () => {
    (armRequest as jest.Mock).mockRejectedValue(new Error("ARM request failed"));

    await expect(readDatabasesForAccount("sub", "rg", "account")).rejects.toThrow("ARM request failed");
  });
});
