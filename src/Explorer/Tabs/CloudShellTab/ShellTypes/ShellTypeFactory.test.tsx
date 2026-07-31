import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { listKeys } from "../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { acquireMsalTokenForAccount, getMsalInstance } from "../../../../Utils/AuthorizationUtils";
import { CassandraShellHandler } from "./CassandraShellHandler";
import { CosmosDBShellHandler } from "./CosmosDBShellHandler";
import { MongoShellHandler } from "./MongoShellHandler";
import { PostgresShellHandler } from "./PostgresShellHandler";
import { getCosmosDBShellCredential, getHandler, getKey } from "./ShellTypeFactory";
import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

interface UserContextType {
  databaseAccount: { name: string; properties?: { disableLocalAuth?: boolean } };
  subscriptionId: string;
  resourceGroup: string;
  features: { enableAadDataPlane: boolean };
  dataPlaneRbacEnabled: boolean;
  aadToken?: string;
  apiType?: string;
}

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: { name: "testDbName" },
    subscriptionId: "testSubId",
    resourceGroup: "testResourceGroup",
    features: { enableAadDataPlane: false },
    dataPlaneRbacEnabled: false,
  },
}));

jest.mock("../../../../Utils/arm/generatedClients/cosmos/databaseAccounts", () => ({
  listKeys: jest.fn(),
}));

jest.mock("../../../../Utils/AuthorizationUtils", () => {
  const actual = jest.requireActual("../../../../Utils/AuthorizationUtils");
  return {
    ...actual,
    getMsalInstance: jest.fn(),
    acquireMsalTokenForAccount: jest.fn(),
  };
});

describe("ShellTypeHandlerFactory", () => {
  const mockKey = "testKey";

  const mockMsalAccounts = (accounts: { username: string }[]): void => {
    (getMsalInstance as jest.Mock).mockResolvedValue({ getAllAccounts: (): { username: string }[] => accounts });
  };

  beforeEach(() => {
    (listKeys as jest.Mock).mockResolvedValue({ primaryMasterKey: mockKey });
    mockMsalAccounts([]);
    (acquireMsalTokenForAccount as jest.Mock).mockResolvedValue("");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Clean up after all tests
  afterAll(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  // Negative test cases
  describe("Negative test cases", () => {
    it("should throw an error for unsupported terminal kind", async () => {
      await expect(getHandler("UnsupportedKind" as unknown as TerminalKind)).rejects.toThrow(
        "Unsupported shell type: UnsupportedKind",
      );
    });

    it("should return empty string when database name is missing", async () => {
      // Temporarily modify the mock
      const originalName = userContext.databaseAccount.name;
      type DatabaseAccountType = { name: string };
      (userContext.databaseAccount as DatabaseAccountType).name = "";

      const key = await getKey(false);
      expect(key).toBe("");
      expect(listKeys).not.toHaveBeenCalled();

      // Restore the mock
      (userContext.databaseAccount as DatabaseAccountType).name = originalName;
    });

    it("should return empty string when listKeys returns null", async () => {
      (listKeys as jest.Mock).mockResolvedValue(null);

      const key = await getKey(false);
      expect(key).toBe("");
    });

    it("should return empty string when primaryMasterKey is missing", async () => {
      (listKeys as jest.Mock).mockResolvedValue({
        /* no primaryMasterKey */
      });

      const key = await getKey(false);
      expect(key).toBe("");
    });
  });

  // Positive test cases
  describe("Positive test cases", () => {
    it("should return PostgresShellHandler for Postgres terminal kind", async () => {
      const handler = await getHandler(TerminalKind.Postgres);
      expect(handler).toBeInstanceOf(PostgresShellHandler);
    });

    it("should return MongoShellHandler with key for Mongo terminal kind", async () => {
      const handler = await getHandler(TerminalKind.Mongo);
      expect(handler).toBeInstanceOf(MongoShellHandler);
    });

    it("should return VCoreMongoShellHandler for VCoreMongo terminal kind", async () => {
      const handler = await getHandler(TerminalKind.VCoreMongo);
      expect(handler).toBeInstanceOf(VCoreMongoShellHandler);
    });

    it("should return CassandraShellHandler with key for Cassandra terminal kind", async () => {
      const handler = await getHandler(TerminalKind.Cassandra);
      expect(handler).toBeInstanceOf(CassandraShellHandler);
    });

    it("should return CosmosDBShellHandler with key for CosmosDB terminal kind", async () => {
      const handler = await getHandler(TerminalKind.CosmosDB);
      expect(handler).toBeInstanceOf(CosmosDBShellHandler);
    });

    it("should get key successfully when database name exists", async () => {
      const key = await getKey(false);
      expect(key).toBe(mockKey);
      expect(listKeys).toHaveBeenCalledWith("testSubId", "testResourceGroup", "testDbName");
    });

    it("should return the aadToken without listing keys when Entra ID auth is requested", async () => {
      (userContext as UserContextType).aadToken = "aadToken123";

      const key = await getKey(true);
      expect(key).toBe("aadToken123");
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should return an empty string when Entra ID auth is requested but no cached token or account exists", async () => {
      (userContext as UserContextType).aadToken = undefined;
      mockMsalAccounts([]);

      const key = await getKey(true);
      expect(key).toBe("");
      expect(acquireMsalTokenForAccount).not.toHaveBeenCalled();
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should silently mint a Cosmos token when Entra ID auth is requested and an MSAL account is cached", async () => {
      (userContext as UserContextType).aadToken = undefined;
      mockMsalAccounts([{ username: "user@contoso.com" }]);
      (acquireMsalTokenForAccount as jest.Mock).mockResolvedValue("mintedToken123");

      const key = await getKey(true);
      expect(key).toBe("mintedToken123");
      expect(acquireMsalTokenForAccount).toHaveBeenCalled();
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should return an empty string when the silent token acquisition fails", async () => {
      (userContext as UserContextType).aadToken = undefined;
      mockMsalAccounts([{ username: "user@contoso.com" }]);
      (acquireMsalTokenForAccount as jest.Mock).mockRejectedValue(new Error("interaction_required"));
      jest.spyOn(console, "error").mockImplementation(() => undefined);

      const key = await getKey(true);
      expect(key).toBe("");
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should return MongoShellHandler with primaryMasterKey for TerminalKind.Mongo when RBAC is disabled", async () => {
      (listKeys as jest.Mock).mockResolvedValue({ primaryMasterKey: "primaryKey123" });
      (userContext as UserContextType).features.enableAadDataPlane = false;
      (userContext as UserContextType).dataPlaneRbacEnabled = false;
      const handler = await getHandler(TerminalKind.Mongo);
      expect(handler).toBeInstanceOf(MongoShellHandler);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(handler.key).toBe("primaryKey123");
    });

    it("should return MongoShellHandler with aadToken for TerminalKind.Mongo when RBAC is enabled", async () => {
      (userContext as UserContextType).aadToken = "aadToken123";
      (userContext as UserContextType).features.enableAadDataPlane = true;
      (userContext as UserContextType).dataPlaneRbacEnabled = true;
      (userContext as UserContextType).apiType = "Mongo";
      const handler = await getHandler(TerminalKind.Mongo);
      expect(handler).toBeInstanceOf(MongoShellHandler);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(handler.key).toBe("aadToken123");
    });
    it("should throw error for unsupported shell type", async () => {
      await expect(getHandler("UnknownShell" as unknown as TerminalKind)).rejects.toThrow(
        "Unsupported shell type: UnknownShell",
      );
    });
  });

  describe("getCosmosDBShellCredential", () => {
    beforeEach(() => {
      (userContext as UserContextType).aadToken = undefined;
      (userContext as UserContextType).apiType = "SQL";
      (userContext as UserContextType).features.enableAadDataPlane = false;
      (userContext as UserContextType).dataPlaneRbacEnabled = false;
      (userContext as UserContextType).databaseAccount.properties = { disableLocalAuth: false };
    });

    it("should return the account key when Entra ID auth is not enabled", async () => {
      const credential = await getCosmosDBShellCredential();

      expect(credential).toEqual({ kind: "key", value: mockKey });
      expect(listKeys).toHaveBeenCalledWith("testSubId", "testResourceGroup", "testDbName");
    });

    it("should return the cached aadToken when Entra ID auth is enabled", async () => {
      (userContext as UserContextType).dataPlaneRbacEnabled = true;
      (userContext as UserContextType).aadToken = "aadToken123";

      const credential = await getCosmosDBShellCredential();

      expect(credential).toEqual({ kind: "token", value: "aadToken123" });
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should return a silently minted token when an MSAL account is cached", async () => {
      (userContext as UserContextType).dataPlaneRbacEnabled = true;
      mockMsalAccounts([{ username: "user@contoso.com" }]);
      (acquireMsalTokenForAccount as jest.Mock).mockResolvedValue("mintedToken123");

      const credential = await getCosmosDBShellCredential();

      expect(credential).toEqual({ kind: "token", value: "mintedToken123" });
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should fall back to the account key when no token could be resolved", async () => {
      (userContext as UserContextType).dataPlaneRbacEnabled = true;

      const credential = await getCosmosDBShellCredential();

      expect(acquireMsalTokenForAccount).not.toHaveBeenCalled();
      expect(credential).toEqual({ kind: "key", value: mockKey });
    });

    it("should fall back to the account key when the silent token acquisition throws", async () => {
      (userContext as UserContextType).dataPlaneRbacEnabled = true;
      mockMsalAccounts([{ username: "user@contoso.com" }]);
      (acquireMsalTokenForAccount as jest.Mock).mockRejectedValue(new Error("interaction_required"));
      jest.spyOn(console, "error").mockImplementation(() => undefined);

      const credential = await getCosmosDBShellCredential();

      expect(credential).toEqual({ kind: "key", value: mockKey });
    });

    it("should not fall back to the account key when local auth is disabled", async () => {
      (userContext as UserContextType).databaseAccount.properties = { disableLocalAuth: true };
      jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const credential = await getCosmosDBShellCredential();

      expect(credential).toBeUndefined();
      expect(listKeys).not.toHaveBeenCalled();
    });

    it("should return undefined when listing the account keys fails", async () => {
      (listKeys as jest.Mock).mockRejectedValue(new Error("Forbidden"));
      jest.spyOn(console, "error").mockImplementation(() => undefined);

      const credential = await getCosmosDBShellCredential();

      expect(credential).toBeUndefined();
    });

    it("should return undefined when the database name is missing", async () => {
      (userContext as UserContextType).databaseAccount.name = "";

      const credential = await getCosmosDBShellCredential();

      expect(credential).toBeUndefined();
      expect(listKeys).not.toHaveBeenCalled();

      (userContext as UserContextType).databaseAccount.name = "testDbName";
    });
  });
});
