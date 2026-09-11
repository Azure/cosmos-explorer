import * as Localization from "Localization/t";
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
  const endpoint = "https://test-account.documents.azure.com:443/";
  const connectionProgress = "printf '%s\\n' 'Connecting to your Cosmos DB account...'";
  const tokenConnectionCommand = `${connectionProgress}; export COSMOSDB_SHELL_TOKEN='aadToken123'; cosmosdbshell --connect '${endpoint}' --connect-mode gateway --verbose`;
  const keyConnectionCommand = `${connectionProgress}; export COSMOSDB_SHELL_ACCOUNT_KEY='${mockKey}'; cosmosdbshell --connect '${endpoint}' --connect-mode gateway --verbose`;
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

    it("should describe each setup step only in the corresponding command branch", () => {
      const commands = cosmosDBShellHandler.getSetUpCommands();
      const sdkCommand = commands.find((command) => command.includes("dotnet-install.sh"));
      const shellCommand = commands.find((command) => command.includes("dotnet tool install"));

      expect(sdkCommand).toContain(
        "then printf '%s\\n' 'Downloading and installing .NET SDK 10. First-time setup may take a few minutes.'; curl",
      );
      expect(shellCommand).toContain("then printf '%s\\n' 'Installing Cosmos DB Shell...'; dotnet tool install");
      expect(shellCommand).toContain(
        "else printf '%s\\n' 'Checking for Cosmos DB Shell updates...'; dotnet tool update",
      );
      expect(commands).toHaveLength(6);
    });

    it("should quote localized progress messages safely for Bash", () => {
      const translation = jest.spyOn(Localization, "t").mockReturnValue("Account's $HOME `command` %s");
      try {
        expect(cosmosDBShellHandler.getConnectionCommand()).toContain(
          "printf '%s\\n' 'Account'\\''s $HOME `command` %s'; export",
        );
      } finally {
        translation.mockRestore();
      }
    });

    it("should not export any credential env var in setup commands for a key credential", () => {
      const commands = cosmosDBShellHandler.getSetUpCommands();

      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_"))).toBe(false);
    });

    it("should not export any credential env var in setup commands for a token credential", () => {
      const handler = new CosmosDBShellHandler({ kind: "token", value: "aadToken123" });
      const commands = handler.getSetUpCommands();

      expect(commands.some((c) => c.includes("COSMOSDB_SHELL_"))).toBe(false);
    });

    it("should export the account key and connect to the bare endpoint on the same command line", () => {
      expect(cosmosDBShellHandler.getConnectionCommand()).toBe(keyConnectionCommand);
    });

    it("should export the token and connect to the bare endpoint on the same command line", () => {
      const handler = new CosmosDBShellHandler({ kind: "token", value: "aadToken123" });

      expect(handler.getConnectionCommand()).toBe(tokenConnectionCommand);
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
      expect(connectionCommand).not.toContain("Connecting to your Cosmos DB account");
      expect(connectionCommand).toContain("Unable to acquire a Cosmos DB credential");
      expect(connectionCommand).toContain("Login for Entra ID");
    });

    it("should echo the specific reason when one is provided", () => {
      const handler = new CosmosDBShellHandler(undefined, "listing the account keys failed (Forbidden)");
      const connectionCommand = handler.getConnectionCommand();

      expect(connectionCommand).toContain("Unable to acquire a Cosmos DB credential");
      expect(connectionCommand).toContain("listing the account keys failed (Forbidden)");
    });
  });
});
