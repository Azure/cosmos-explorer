/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Tests for Mongo shell type handler
 */

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
  },
}));

jest.mock("../Utils/CommonUtils", () => ({
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
      expect(commands.length).toBe(6);
      expect(commands[1]).toContain("mongosh-2.5.0-linux-x64.tgz");
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

      const command = mongoShellHandler.getConnectionCommand();

      expect(command).toBe(
        "mongosh --host test-mongo.documents.azure.com --port 10255 --username test-account --password test-key --tls --tlsAllowInvalidCertificates",
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
  });

  describe("getTerminalSuppressedData", () => {
    it("should return the correct warning message", () => {
      expect(mongoShellHandler.getTerminalSuppressedData()).toBe("Warning: Non-Genuine MongoDB Detected");
    });
  });
});
