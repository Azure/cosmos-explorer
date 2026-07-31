import { isCloudShellEntraAuthEnabled } from "../../../../Utils/AuthorizationUtils";
import { CosmosDBShellHandler } from "./CosmosDBShellHandler";

// Mock dependencies
jest.mock("../../../../ConfigContext", () => ({
  configContext: {
    AAD_ENDPOINT: "https://login.microsoftonline.com/",
  },
}));

jest.mock("../../../../UserContext", () => ({
  userContext: {
    tenantId: "test-tenant-id",
    subscriptionId: "test-subscription-id",
    resourceGroup: "test-resource-group",
    databaseAccount: {
      properties: {
        documentEndpoint: "https://test-account.documents.azure.com:443/",
      },
    },
  },
}));

jest.mock("../../../../Utils/AuthorizationUtils", () => ({
  isCloudShellEntraAuthEnabled: jest.fn().mockReturnValue(false),
}));

describe("CosmosDBShellHandler", () => {
  const mockKey = "testKey";
  let cosmosDBShellHandler: CosmosDBShellHandler;

  beforeEach(() => {
    (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(false);
    cosmosDBShellHandler = new CosmosDBShellHandler(mockKey);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("Positive Tests", () => {
    it("should return correct shell name", () => {
      expect(cosmosDBShellHandler.getShellName()).toBe("Cosmos DB");
    });

    it("should install the CosmosDBShell tool in setup commands", () => {
      const commands = cosmosDBShellHandler.getSetUpCommands();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.some((c) => c.includes("dotnet tool install --global CosmosDBShell --prerelease"))).toBe(true);
      expect(commands.some((c) => c.includes("dotnet tool update --global CosmosDBShell --prerelease"))).toBe(true);
      expect(commands.some((c) => c.includes("$HOME/.dotnet/tools"))).toBe(true);
    });

    it("should bootstrap a .NET SDK 10 when the tool and SDK are missing", () => {
      const commands = cosmosDBShellHandler.getSetUpCommands();

      expect(commands.some((c) => c.includes("dotnet-install.sh") && c.includes("--channel 10.0"))).toBe(true);
      expect(commands.some((c) => c === "export DOTNET_ROOT=$HOME/.dotnet")).toBe(true);
    });

    it("should export the account key env var when RBAC is disabled", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(false);
      const handler = new CosmosDBShellHandler(mockKey);
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c === `export COSMOSDB_SHELL_ACCOUNT_KEY='${mockKey}'`)).toBe(true);
    });

    it("should export the token env var when RBAC is enabled", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(true);
      const handler = new CosmosDBShellHandler("aadToken123");
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c === `export COSMOSDB_SHELL_TOKEN='aadToken123'`)).toBe(true);
    });

    it("should generate proper connection command with endpoint", () => {
      const connectionCommand = cosmosDBShellHandler.getConnectionCommand();

      expect(connectionCommand).toBe(
        "cosmosdbshell --connect 'https://test-account.documents.azure.com:443/' --connect-mode gateway --verbose",
      );
    });

    it("should not add the tenant flag on the Entra ID connection command", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(true);
      const handler = new CosmosDBShellHandler("aadToken123");
      const connectionCommand = handler.getConnectionCommand();

      expect(connectionCommand).toBe(
        "cosmosdbshell --connect 'https://test-account.documents.azure.com:443/' --connect-mode gateway --verbose",
      );
      expect(connectionCommand).not.toContain("--connect-tenant");
    });

    it("should use interactive Entra authentication when no token was fetched", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(true);
      const handler = new CosmosDBShellHandler("");
      const connectionCommand = handler.getConnectionCommand();

      expect(connectionCommand).toBe(
        "cosmosdbshell --connect 'https://test-account.documents.azure.com:443/' --connect-mode gateway --connect-tenant 'test-tenant-id' --connect-authority-host 'https://login.microsoftonline.com/' --connect-subscription 'test-subscription-id' --connect-resource-group 'test-resource-group' --verbose",
      );
      expect(connectionCommand).not.toContain("--connect-azure-cli");
    });

    it("should not use interactive Entra authentication when a token env var is exported", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(true);
      const handler = new CosmosDBShellHandler("aadToken123");

      expect(handler.getConnectionCommand()).not.toContain("--connect-tenant");
    });

    it("should use interactive Entra authentication when no credential could be resolved on the key-auth path", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(false);
      const handler = new CosmosDBShellHandler("");

      expect(handler.getConnectionCommand()).toContain("--connect-tenant 'test-tenant-id'");
    });

    it("should not use interactive Entra authentication when an account key env var is exported", () => {
      (isCloudShellEntraAuthEnabled as jest.Mock).mockReturnValue(false);
      const handler = new CosmosDBShellHandler("someKey");

      expect(handler.getConnectionCommand()).not.toContain("--connect-tenant");
    });

    it("should return empty array for terminal suppressed data", () => {
      expect(cosmosDBShellHandler.getTerminalSuppressedData()).toEqual([]);
    });
  });

  describe("Negative Tests", () => {
    it("should not export a credential env var when key is empty", () => {
      const handler = new CosmosDBShellHandler("");
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_"))).toBe(false);
    });
  });
});
