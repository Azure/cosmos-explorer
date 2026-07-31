import { CosmosDBShellHandler } from "./CosmosDBShellHandler";

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: {
      properties: {
        documentEndpoint: "https://test-account.documents.azure.com:443/",
      },
    },
  },
}));

describe("CosmosDBShellHandler", () => {
  const mockKey = "testKey";
  const expectedConnectionCommand =
    "cosmosdbshell --connect 'https://test-account.documents.azure.com:443/' --connect-mode gateway --verbose";
  let cosmosDBShellHandler: CosmosDBShellHandler;

  beforeEach(() => {
    cosmosDBShellHandler = new CosmosDBShellHandler({ kind: "key", value: mockKey });
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

    it("should export the account key env var for a key credential", () => {
      const commands = cosmosDBShellHandler.getSetUpCommands();

      expect(commands.some((c) => c === `export COSMOSDB_SHELL_ACCOUNT_KEY='${mockKey}'`)).toBe(true);
      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_TOKEN"))).toBe(false);
    });

    it("should export the token env var for a token credential", () => {
      const handler = new CosmosDBShellHandler({ kind: "token", value: "aadToken123" });
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c === `export COSMOSDB_SHELL_TOKEN='aadToken123'`)).toBe(true);
      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_ACCOUNT_KEY"))).toBe(false);
    });

    it("should generate proper connection command with endpoint for a key credential", () => {
      expect(cosmosDBShellHandler.getConnectionCommand()).toBe(expectedConnectionCommand);
    });

    it("should generate the same connection command for a token credential", () => {
      const handler = new CosmosDBShellHandler({ kind: "token", value: "aadToken123" });

      expect(handler.getConnectionCommand()).toBe(expectedConnectionCommand);
    });

    it("should never pass an interactive or ambient credential flag", () => {
      const handler = new CosmosDBShellHandler({ kind: "token", value: "aadToken123" });
      const connectionCommand = handler.getConnectionCommand();

      expect(connectionCommand).not.toContain("--connect-tenant");
      expect(connectionCommand).not.toContain("--connect-hint");
      expect(connectionCommand).not.toContain("--connect-authority-host");
      expect(connectionCommand).not.toContain("--connect-azure-cli");
      expect(connectionCommand).not.toContain("--connect-managed-identity");
      expect(connectionCommand).not.toContain("--connect-vscode-credential");
    });

    it("should return empty array for terminal suppressed data", () => {
      expect(cosmosDBShellHandler.getTerminalSuppressedData()).toEqual([]);
    });
  });

  describe("Negative Tests", () => {
    it("should not export a credential env var when no credential was resolved", () => {
      const handler = new CosmosDBShellHandler(undefined);
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_"))).toBe(false);
    });

    it("should not launch the shell when no credential was resolved", () => {
      const handler = new CosmosDBShellHandler(undefined);
      const connectionCommand = handler.getConnectionCommand();

      expect(connectionCommand).not.toContain("cosmosdbshell --connect");
      expect(connectionCommand).toContain("Unable to acquire a Cosmos DB credential");
      expect(connectionCommand).toContain("Login for Entra ID");
    });
  });
});
