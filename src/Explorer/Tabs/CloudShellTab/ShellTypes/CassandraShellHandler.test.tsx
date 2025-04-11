import * as CommonUtils from "../Utils/CommonUtils";
import { CassandraShellHandler } from "./CassandraShellHandler";

// Define mock state that can be modified by tests
const mockState = {
  databaseAccount: {
    name: "test-account",
    properties: {
      cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/"
    }
  }
};

// Mock dependencies using factory functions
jest.mock("../../../../UserContext", () => ({
  get userContext() {
    return {
      get databaseAccount() {
        return mockState.databaseAccount;
      }
    };
  }
}));

jest.mock("../Utils/CommonUtils", () => ({
  getHostFromUrl: jest.fn().mockReturnValue("test-endpoint.cassandra.cosmos.azure.com")
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
        cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/"
      }
    };
  });

  describe("Positive test cases", () => {
    test("should return 'Cassandra' as shell name", () => {
      expect(handler.getShellName()).toBe("Cassandra");
    });

    test("should return cassandra endpoint from userContext", () => {
      expect(handler.getEndpoint()).toBe("https://test-endpoint.cassandra.cosmos.azure.com:443/");
    });

    test("should return an array of setup commands", () => {
      const commands = handler.getSetUpCommands();
      
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(8);
      expect(commands).toContain("source ~/.bashrc");
      expect(commands.some(cmd => cmd.includes("export PATH=$HOME/cassandra/bin:$PATH"))).toBe(true);
      expect(commands.some(cmd => cmd.includes("export SSL_VERSION=TLSv1_2"))).toBe(true);
    });

    test("should return correct connection command", () => {
      const expectedCommand = "cqlsh test-endpoint.cassandra.cosmos.azure.com 10350 -u test-account -p test-key --ssl --protocol-version=4";
      
      expect(handler.getConnectionCommand()).toBe(expectedCommand);
      expect(CommonUtils.getHostFromUrl).toHaveBeenCalledWith("https://test-endpoint.cassandra.cosmos.azure.com:443/");
    });

    test("should return the correct terminal suppressed data", () => {
      expect(handler.getTerminalSuppressedData()).toBe("");
    });
    
    test("should include the correct package version in setup commands", () => {
      const commands = handler.getSetUpCommands();
      const hasCorrectPackageVersion = commands.some(cmd => cmd.includes("apache-cassandra-5.0.3-bin.tar.gz"));
      
      expect(hasCorrectPackageVersion).toBe(true);
    });
  });

  describe("Negative test cases", () => {
    test("should handle undefined databaseAccount when getting endpoint", () => {
      mockState.databaseAccount = undefined;
      
      expect(handler.getEndpoint()).toBeUndefined();
    });

    test("should handle undefined properties when getting endpoint", () => {
      mockState.databaseAccount = { name: "test-account" } as any;
      
      expect(handler.getEndpoint()).toBeUndefined();
    });

    test("should handle undefined cassandraEndpoint", () => {
      mockState.databaseAccount = { 
        name: "test-account",
        properties: {} 
      } as any;
      
      expect(handler.getEndpoint()).toBeUndefined();
    });

    test("should handle empty host from URL", () => {
      (CommonUtils.getHostFromUrl as jest.Mock).mockReturnValueOnce("");
      
      const command = handler.getConnectionCommand();
      
      expect(command).toBe("cqlsh  10350 -u test-account -p test-key --ssl --protocol-version=4");
    });

    test("should handle empty key", () => {
      const emptyKeyHandler = new CassandraShellHandler("");
      
      expect(emptyKeyHandler.getConnectionCommand()).toBe("cqlsh test-endpoint.cassandra.cosmos.azure.com 10350 -u test-account -p  --ssl --protocol-version=4");
    });
    
    test("should handle undefined account name", () => {
      mockState.databaseAccount = { 
        properties: { cassandraEndpoint: "https://test-endpoint.cassandra.cosmos.azure.com:443/" }
      } as any;
      
      expect(handler.getConnectionCommand()).toBe("echo 'Database name not found.'");
    });
    
    test("should handle fully undefined userContext", () => {
      mockState.databaseAccount = undefined;
      (CommonUtils.getHostFromUrl as jest.Mock).mockReturnValueOnce("");
      
      expect(handler.getConnectionCommand()).toBe("echo 'Cassandra endpoint not found.'");
    });
  });
});
