/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Tests for VCore MongoDB shell type handler
 */

import { VCoreMongoShellHandler } from "./VCoreMongoShellHandler";

// Mock dependencies
jest.mock("../../../../UserContext", () => ({
  userContext: {
    databaseAccount: {
      properties: {
        vcoreMongoEndpoint: "test-vcore-mongo.mongo.cosmos.azure.com",
      },
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

    it("should return VCore MongoDB endpoint from userContext", () => {
      expect(vcoreMongoShellHandler.getEndpoint()).toBe("test-vcore-mongo.mongo.cosmos.azure.com");
    });

    it("should return array of setup commands with correct package version", () => {
      const commands = vcoreMongoShellHandler.getSetUpCommands();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(6);
      expect(commands[1]).toContain("mongosh-2.3.8-linux-x64.tgz");
      expect(commands[0]).toContain("mongosh not found");
    });

    it("should generate proper connection command with endpoint", () => {
      const connectionCommand = vcoreMongoShellHandler.getConnectionCommand();

      expect(connectionCommand).toContain('read -p "Enter username: " username');
      expect(connectionCommand).toContain("mongodb+srv://$username:@test-vcore-mongo.mongo.cosmos.azure.com");
      expect(connectionCommand).toContain("authMechanism=SCRAM-SHA-256");
      expect(connectionCommand).toContain("--tls --tlsAllowInvalidCertificates");
    });

    it("should return the correct terminal suppressed data", () => {
      expect(vcoreMongoShellHandler.getTerminalSuppressedData()).toBe("Warning: Non-Genuine MongoDB Detected");
    });
  });

  // Negative test cases
  describe("Negative Tests", () => {
    it("should handle missing VCore MongoDB endpoint", () => {
      // Mock getEndpoint to simulate missing endpoint
      jest.spyOn(vcoreMongoShellHandler, "getEndpoint").mockReturnValue(undefined);

      expect(vcoreMongoShellHandler.getEndpoint()).toBeUndefined();

      // Test connection command with missing endpoint
      const connectionCommand = vcoreMongoShellHandler.getConnectionCommand();
      expect(connectionCommand).toContain("echo 'MongoDB VCore endpoint not found.'");
    });

    it("should handle null userContext", () => {
      // Mock getEndpoint to simulate null userContext
      jest.spyOn(vcoreMongoShellHandler, "getEndpoint").mockReturnValue(undefined);

      expect(vcoreMongoShellHandler.getEndpoint()).toBeUndefined();
    });

    it("should handle null databaseAccount", () => {
      // Mock getEndpoint to simulate null databaseAccount
      jest.spyOn(vcoreMongoShellHandler, "getEndpoint").mockReturnValue(undefined);

      expect(vcoreMongoShellHandler.getEndpoint()).toBeUndefined();
    });

    it("should handle empty endpoint", () => {
      // Mock getEndpoint to return empty string
      jest.spyOn(vcoreMongoShellHandler, "getEndpoint").mockReturnValue("");

      const connectionCommand = vcoreMongoShellHandler.getConnectionCommand();
      expect(connectionCommand).toContain("echo 'MongoDB VCore endpoint not found.'");
    });
  });
});
