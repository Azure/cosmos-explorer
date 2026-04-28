jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
jest.mock("../../Utils/arm/generatedClients/cosmos/sqlResources");

import ko from "knockout";
import { AuthType } from "../../AuthType";
import { CreateDatabaseParams, DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { useDatabases } from "../../Explorer/useDatabases";
import { updateUserContext } from "../../UserContext";
import { createUpdateSqlDatabase } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { SqlDatabaseGetResults } from "../../Utils/arm/generatedClients/cosmos/types";
import { createDatabase } from "./createDatabase";

const mockCreateUpdateSqlDatabase = createUpdateSqlDatabase as jest.MockedFunction<typeof createUpdateSqlDatabase>;

describe("createDatabase", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: { name: "default-account" } as DatabaseAccount,
      subscriptionId: "default-subscription",
      resourceGroup: "default-rg",
      apiType: "SQL",
      authType: AuthType.AAD,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUpdateSqlDatabase.mockResolvedValue({
      properties: { resource: { id: "db", _rid: "", _self: "", _ts: 0, _etag: "" } },
    } as SqlDatabaseGetResults);
    useDatabases.setState({
      databases: [],
      validateDatabaseId: () => true,
    } as unknown as ReturnType<typeof useDatabases.getState>);
  });

  it("should call ARM createUpdateSqlDatabase when logged in with AAD", async () => {
    await createDatabase({ databaseId: "testDb" });
    expect(mockCreateUpdateSqlDatabase).toHaveBeenCalled();
  });

  describe("targetAccountOverride behavior", () => {
    it("should use targetAccountOverride subscriptionId, resourceGroup, and accountName for SQL DB creation", async () => {
      const params: CreateDatabaseParams = {
        databaseId: "testDb",
        targetAccountOverride: {
          subscriptionId: "override-sub",
          resourceGroup: "override-rg",
          accountName: "override-account",
          capabilities: [],
        },
      };

      await createDatabase(params);

      expect(mockCreateUpdateSqlDatabase).toHaveBeenCalledWith(
        "override-sub",
        "override-rg",
        "override-account",
        "testDb",
        expect.any(Object),
      );
    });

    it("should use userContext values when targetAccountOverride is not provided", async () => {
      await createDatabase({ databaseId: "testDb" });

      expect(mockCreateUpdateSqlDatabase).toHaveBeenCalledWith(
        "default-subscription",
        "default-rg",
        "default-account",
        "testDb",
        expect.any(Object),
      );
    });

    it("should skip validateDatabaseId check when targetAccountOverride is provided", async () => {
      // Simulate database already existing — validateDatabaseId returns false
      useDatabases.setState({
        databases: [{ id: ko.observable("testDb") } as unknown as ViewModels.Database],
        validateDatabaseId: () => false,
      } as unknown as ReturnType<typeof useDatabases.getState>);

      const params: CreateDatabaseParams = {
        databaseId: "testDb",
        targetAccountOverride: {
          subscriptionId: "override-sub",
          resourceGroup: "override-rg",
          accountName: "override-account",
          capabilities: [],
        },
      };

      // Should NOT throw even though the normal duplicate check would fail
      await expect(createDatabase(params)).resolves.not.toThrow();
      expect(mockCreateUpdateSqlDatabase).toHaveBeenCalled();
    });

    it("should throw if validateDatabaseId returns false and no targetAccountOverride is set", async () => {
      useDatabases.setState({
        databases: [{ id: ko.observable("existingDb") } as unknown as ViewModels.Database],
        validateDatabaseId: () => false,
      } as unknown as ReturnType<typeof useDatabases.getState>);

      await expect(createDatabase({ databaseId: "existingDb" })).rejects.toThrow();
      expect(mockCreateUpdateSqlDatabase).not.toHaveBeenCalled();
    });

    it("should pass databaseId in request payload regardless of targetAccountOverride", async () => {
      const params: CreateDatabaseParams = {
        databaseId: "my-database",
        targetAccountOverride: {
          subscriptionId: "any-sub",
          resourceGroup: "any-rg",
          accountName: "any-account",
          capabilities: [],
        },
      };

      await createDatabase(params);

      expect(mockCreateUpdateSqlDatabase).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        "my-database",
        expect.objectContaining({
          properties: expect.objectContaining({
            resource: expect.objectContaining({ id: "my-database" }),
          }),
        }),
      );
    });
  });
});
