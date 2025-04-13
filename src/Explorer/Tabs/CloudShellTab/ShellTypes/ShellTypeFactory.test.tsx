import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { CassandraShellHandler } from "./CassandraShellHandler";
import { MongoShellHandler } from "./MongoShellHandler";
import { PostgresShellHandler } from "./PostgresShellHandler";
import { ShellTypeHandlerFactory } from "./ShellTypeFactory";
import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: { name: "testDbName" },
    subscriptionId: "testSubId",
    resourceGroup: "testResourceGroup",
  },
}));

jest.mock("../../../../Utils/arm/generatedClients/cosmos/databaseAccounts", () => ({
  listKeys: jest.fn(),
}));

describe("ShellTypeHandlerFactory", () => {
  const mockKey = "testKey";

  beforeEach(() => {
    (listKeys as jest.Mock).mockResolvedValue({ primaryMasterKey: mockKey });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Negative test cases
  describe("Negative test cases", () => {
    it("should throw an error for unsupported terminal kind", async () => {
      await expect(ShellTypeHandlerFactory.getHandler("UnsupportedKind" as unknown as TerminalKind)).rejects.toThrow(
        "Unsupported shell type: UnsupportedKind",
      );
    });

    it("should return empty string when database name is missing", async () => {
      // Temporarily modify the mock
      const originalName = userContext.databaseAccount.name;
      (userContext.databaseAccount as any).name = "";

      const key = await ShellTypeHandlerFactory.getKey();
      expect(key).toBe("");
      expect(listKeys).not.toHaveBeenCalled();

      // Restore the mock
      (userContext.databaseAccount as any).name = originalName;
    });

    it("should return empty string when listKeys returns null", async () => {
      (listKeys as jest.Mock).mockResolvedValue(null);

      const key = await ShellTypeHandlerFactory.getKey();
      expect(key).toBe("");
    });

    it("should return empty string when primaryMasterKey is missing", async () => {
      (listKeys as jest.Mock).mockResolvedValue({
        /* no primaryMasterKey */
      });

      const key = await ShellTypeHandlerFactory.getKey();
      expect(key).toBe("");
    });
  });

  // Positive test cases
  describe("Positive test cases", () => {
    it("should return PostgresShellHandler for Postgres terminal kind", async () => {
      const handler = await ShellTypeHandlerFactory.getHandler(TerminalKind.Postgres);
      expect(handler).toBeInstanceOf(PostgresShellHandler);
    });

    it("should return MongoShellHandler with key for Mongo terminal kind", async () => {
      const handler = await ShellTypeHandlerFactory.getHandler(TerminalKind.Mongo);
      expect(handler).toBeInstanceOf(MongoShellHandler);
    });

    it("should return VCoreMongoShellHandler for VCoreMongo terminal kind", async () => {
      const handler = await ShellTypeHandlerFactory.getHandler(TerminalKind.VCoreMongo);
      expect(handler).toBeInstanceOf(VCoreMongoShellHandler);
    });

    it("should return CassandraShellHandler with key for Cassandra terminal kind", async () => {
      const handler = await ShellTypeHandlerFactory.getHandler(TerminalKind.Cassandra);
      expect(handler).toBeInstanceOf(CassandraShellHandler);
    });

    it("should get key successfully when database name exists", async () => {
      const key = await ShellTypeHandlerFactory.getKey();
      expect(key).toBe(mockKey);
      expect(listKeys).toHaveBeenCalledWith("testSubId", "testResourceGroup", "testDbName");
    });
  });
});
