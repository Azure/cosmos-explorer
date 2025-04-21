import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: {
      properties: {
        vcoreMongoEndpoint: "test-vcore-mongo.mongo.cosmos.azure.com",
      },
    },
    vcoreMongoConnectionParams: {
      adminLogin: "username",
    },
  },
}));

describe("VCoreMongoShellHandler", () => {
  let vcoreMongoShellHandler: VCoreMongoShellHandler;

  beforeEach(() => {
    vcoreMongoShellHandler = new VCoreMongoShellHandler();
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

  // Positive test cases
  describe("Positive Tests", () => {
    it("should return correct shell name", () => {
      expect(vcoreMongoShellHandler.getShellName()).toBe("MongoDB VCore");
    });

    it("should return array of setup commands with correct package version", () => {
      const commands = vcoreMongoShellHandler.getSetUpCommands();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(6);
      expect(commands[1]).toContain("mongosh-2.5.0-linux-x64.tgz");
      expect(commands[0]).toContain("mongosh not found");
    });

    it("should generate proper connection command with endpoint", () => {
      const connectionCommand = vcoreMongoShellHandler.getConnectionCommand();

      expect(connectionCommand).toContain("mongodb+srv://username:@test-vcore-mongo.mongo.cosmos.azure.com");
      expect(connectionCommand).toContain("authMechanism=SCRAM-SHA-256");
    });

    it("should return the correct terminal suppressed data", () => {
      expect(vcoreMongoShellHandler.getTerminalSuppressedData()).toBe("Warning: Non-Genuine MongoDB Detected");
    });
  });
});
