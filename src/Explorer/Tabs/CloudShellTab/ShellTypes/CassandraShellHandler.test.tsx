import * as CommonUtils from "../Utils/CommonUtils";
import { CassandraShellHandler } from "./CassandraShellHandler";

// Define interfaces for the database account structure
interface DatabaseAccountProperties {
  cassandraEndpoint?: string;
}

interface DatabaseAccount {
  name?: string;
  properties?: DatabaseAccountProperties;
}

// Define mock state that can be modified by tests
const mockState = {
  databaseAccount: {
    name: "test-account",
    properties: {
      cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/",
    },
  } as DatabaseAccount,
};

// Mock dependencies using factory functions
jest.mock("../../../../UserContext", () => ({
  get userContext() {
    return {
      get databaseAccount() {
        return mockState.databaseAccount;
      },
    };
  },
}));

// Reset all modules before running tests
beforeAll(() => {
  jest.resetModules();
});

jest.mock("../Utils/CommonUtils", () => ({
  getHostFromUrl: jest.fn().mockReturnValue("test-endpoint.cassandra.cosmos.azure.com"),
}));

describe("CassandraShellHandler", () => {
  const testKey = "test-key";
  let handler: CassandraShellHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CassandraShellHandler(testKey);

    // Reset mock state before each test
    mockState.databaseAccount = {
      name: "test-account",
      properties: {
        cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/",
      },
    };
  });

  // Clean up after all tests
  afterAll(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("Positive test cases", () => {
    test("should return 'Cassandra' as shell name", () => {
      expect(handler.getShellName()).toBe("Cassandra");
    });

    test("should return an array of setup commands", () => {
      const commands = handler.getSetUpCommands();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(5);
      expect(commands).toContain("source ~/.bashrc");
      expect(
        commands.some((cmd) =>
          cmd.includes("if ! command -v cqlsh &> /dev/null; then echo '⚠️ cqlsh not found. Installing...'; fi"),
        ),
      ).toBe(true);
      expect(commands.some((cmd) => cmd.includes("pip3 install --user cqlsh==6.2.0"))).toBe(true);
      expect(commands.some((cmd) => cmd.includes("export SSL_VERSION=TLSv1_2"))).toBe(true);
      expect(commands.some((cmd) => cmd.includes("export SSL_VALIDATE=false"))).toBe(true);
    });

    test("should return correct connection command", () => {
      const expectedCommand = `cqlsh test-endpoint.cassandra.cosmos.azure.com 10350 -u test-account -p test-key --ssl`;

      expect(handler.getConnectionCommand()).toBe(expectedCommand);
      expect(CommonUtils.getHostFromUrl).toHaveBeenCalledWith("https://test-endpoint.cassandra.cosmos.azure.com:443/");
    });

    test("should return the correct terminal suppressed data", () => {
      expect(handler.getTerminalSuppressedData()).toBe("");
    });

    test("should include the correct package version in setup commands", () => {
      const commands = handler.getSetUpCommands();
      const hasCorrectPackageVersion = commands.some((cmd) => cmd.includes("cqlsh==6.2.0"));

      expect(hasCorrectPackageVersion).toBe(true);
    });
  });

  describe("Negative test cases", () => {
    test("should handle empty host from URL", () => {
      (CommonUtils.getHostFromUrl as jest.Mock).mockReturnValueOnce("");

      const command = handler.getConnectionCommand();

      expect(command).toBe("cqlsh  10350 -u test-account -p test-key --ssl");
    });

    test("should handle empty key", () => {
      const emptyKeyHandler = new CassandraShellHandler("");

      expect(emptyKeyHandler.getConnectionCommand()).toBe(
        "cqlsh test-endpoint.cassandra.cosmos.azure.com 10350 -u test-account -p  --ssl",
      );
    });

    test("should handle undefined account name", () => {
      mockState.databaseAccount = {
        properties: { cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/" },
      };

      expect(handler.getConnectionCommand()).toBe("echo 'Database name not found.'");
    });

    test("should handle undefined database account", () => {
      mockState.databaseAccount = undefined;

      expect(handler.getConnectionCommand()).toBe("echo 'Database name not found.'");
    });

    test("should handle missing cassandra endpoint", () => {
      mockState.databaseAccount = {
        name: "test-account",
        properties: {},
      };

      expect(handler.getConnectionCommand()).toBe("echo 'Cassandra endpoint not found.'");
    });
  });
});
