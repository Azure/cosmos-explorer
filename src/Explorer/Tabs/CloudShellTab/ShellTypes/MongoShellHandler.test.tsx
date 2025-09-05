import { userContext } from "../../../../UserContext";
import * as CommonUtils from "../Utils/CommonUtils";
import { MongoShellHandler } from "./MongoShellHandler";

// Define interfaces for type safety
interface DatabaseAccountProperties {
  mongoEndpoint?: string;
}

interface DatabaseAccount {
  id?: string;
  name: string;
  location?: string;
  type?: string;
  kind?: string;
  properties: DatabaseAccountProperties;
}

interface UserContextType {
  databaseAccount: DatabaseAccount;
  features: {
    enableAadDataPlane: boolean;
  };
  apiType: string;
  dataPlaneRbacEnabled: boolean;
  aadToken?: string;
}

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: {
      name: "test-account",
      properties: {
        mongoEndpoint: "https://test-mongo.documents.azure.com:443/",
      },
    },
    features: { enableAadDataPlane: false },
    apiType: "Mongo",
  },
}));

jest.mock("../Utils/CommonUtils", () => ({
  ...jest.requireActual("../Utils/CommonUtils"),
  getHostFromUrl: jest.fn().mockReturnValue("test-mongo.documents.azure.com"),
}));

describe("MongoShellHandler", () => {
  const testKey = "test-key";
  let mongoShellHandler: MongoShellHandler;

  beforeEach(() => {
    mongoShellHandler = new MongoShellHandler(testKey);
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

  describe("getShellName", () => {
    it("should return MongoDB", () => {
      expect(mongoShellHandler.getShellName()).toBe("MongoDB");
    });
  });

  describe("getSetUpCommands", () => {
    it("should return an array of setup commands", () => {
      const commands = mongoShellHandler.getSetUpCommands();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(7);
      expect(commands[1]).toContain("mongosh-2.5.6-linux-x64.tgz");
    });
  });

  describe("getConnectionCommand", () => {
    it("should return the correct connection command", () => {
      // Save original databaseAccount
      const originalDatabaseAccount = userContext.databaseAccount;

      // Directly assign the modified databaseAccount
      (userContext as UserContextType).databaseAccount = {
        id: "test-id",
        name: "test-account",
        location: "test-location",
        type: "test-type",
        kind: "test-kind",
        properties: { mongoEndpoint: "https://test-mongo.documents.azure.com:443/" },
      };
      (userContext as UserContextType).dataPlaneRbacEnabled = false;

      const command = mongoShellHandler.getConnectionCommand();

      expect(command).toBe(
        "mongosh --nodb --quiet --eval 'disableTelemetry()'; mongosh mongodb://test-mongo.documents.azure.com:10255?appName=CosmosExplorerTerminal --username test-account --password test-key --tls --tlsAllowInvalidCertificates",
      );
      expect(CommonUtils.getHostFromUrl).toHaveBeenCalledWith("https://test-mongo.documents.azure.com:443/");

      // Restore original
      (userContext as UserContextType).databaseAccount = originalDatabaseAccount;
    });

    it("should handle missing database account name", () => {
      // Save original databaseAccount
      const originalDatabaseAccount = userContext.databaseAccount;

      // Directly assign the modified databaseAccount
      (userContext as UserContextType).databaseAccount = {
        id: "test-id",
        name: "", // Empty name to simulate missing name
        location: "test-location",
        type: "test-type",
        kind: "test-kind",
        properties: { mongoEndpoint: "https://test.com" },
      };

      const command = mongoShellHandler.getConnectionCommand();
      expect(command).toBe("echo 'Database name not found.'");

      // Restore original
      (userContext as UserContextType).databaseAccount = originalDatabaseAccount;
    });

    it("should return echo if endpoint is missing", () => {
      const testKey = "test-key";
      (userContext as UserContextType).databaseAccount = {
        id: "test-id",
        name: "", // Empty name to simulate missing name
        location: "test-location",
        type: "test-type",
        kind: "test-kind",
        properties: { mongoEndpoint: "" },
      };
      const mongoShellHandler = new MongoShellHandler(testKey);
      const command = mongoShellHandler.getConnectionCommand();
      expect(command).toBe("echo 'MongoDB endpoint not found.'");
    });

    it("should use _getAadConnectionCommand when _isEntraIdEnabled is true", () => {
      const testKey = "aad-key";
      (userContext as UserContextType).databaseAccount = {
        id: "test-id",
        name: "test-account",
        location: "test-location",
        type: "test-type",
        kind: "test-kind",
        properties: { mongoEndpoint: "https://test-mongo.documents.azure.com:443/" },
      };
      (userContext as UserContextType).dataPlaneRbacEnabled = true;

      const mongoShellHandler = new MongoShellHandler(testKey);

      const command = mongoShellHandler.getConnectionCommand();
      expect(command).toContain("mongosh 'mongodb://test-account:aad-key@test-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&authMechanism=PLAIN&retryWrites=false' --tls --tlsAllowInvalidCertificates");
      expect(command.startsWith("mongosh --nodb")).toBeTruthy();
    });

  });

  describe("getTerminalSuppressedData", () => {
    it("should return the correct warning message", () => {
      expect(mongoShellHandler.getTerminalSuppressedData()).toEqual([
        "Warning: Non-Genuine MongoDB Detected",
        "Telemetry is now disabled.",
      ]);
    });
  });
});
