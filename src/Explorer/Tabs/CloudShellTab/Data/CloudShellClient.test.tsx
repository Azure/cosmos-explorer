/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * Tests for CloudShell API client
 */

import { armRequest } from "../../../../Utils/arm/request";
import { NetworkType, OsType, SessionType, ShellType } from "../Models/DataModels";
import { getLocale } from "../Utils/CommonUtils";
import {
  authorizeSession,
  connectTerminal,
  getUserSettings,
  provisionConsole,
  putEphemeralUserSettings,
  registerCloudShellProvider,
  verifyCloudShellProviderRegistration,
} from "./CloudShellClient";

// Instead of redeclaring fetch, modify the global context
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Define mock endpoint
const MOCK_ARM_ENDPOINT = "https://mock-management.azure.com";

// Mock dependencies
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mocked-uuid"),
}));

jest.mock("../../../../ConfigContext", () => ({
  configContext: {
    ARM_ENDPOINT: "https://mock-management.azure.com",
  },
}));

jest.mock("../../../../UserContext", () => ({
  userContext: {
    authorizationToken: "Bearer mock-token",
  },
}));

jest.mock("../../../../Utils/arm/request");

jest.mock("../Utils/CommonUtils", () => ({
  getLocale: jest.fn().mockReturnValue("en-US"),
}));

// Properly mock fetch with correct typings
const mockJsonPromise = jest.fn();
global.fetch = jest.fn().mockImplementationOnce(() => {
  return {
    ok: true,
    status: 200,
    json: mockJsonPromise,
    text: jest.fn().mockResolvedValue(""),
    headers: new Headers(),
  } as unknown as Promise<Response>;
}) as jest.Mock;

describe("CloudShellClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonPromise.mockClear();
  });

  describe("getUserSettings", () => {
    it("should call armRequest with correct parameters and return settings", async () => {
      const mockSettings = { properties: { preferredLocation: "eastus" } };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockSettings);

      const result = await getUserSettings();

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/providers/Microsoft.Portal/userSettings/cloudconsole",
        method: "GET",
        apiVersion: "2023-02-01-preview",
      });
      expect(result).toEqual(mockSettings);
    });

    it("should handle errors when settings retrieval fails", async () => {
      const mockError = new Error("Failed to get user settings");
      (armRequest as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getUserSettings()).rejects.toThrow("Failed to get user settings");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/providers/Microsoft.Portal/userSettings/cloudconsole",
        method: "GET",
        apiVersion: "2023-02-01-preview",
      });
    });
  });

  describe("putEphemeralUserSettings", () => {
    it("should call armRequest with default network settings", async () => {
      const mockResponse = { id: "settings-id" };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await putEphemeralUserSettings("sub-id", "eastus");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/providers/Microsoft.Portal/userSettings/cloudconsole",
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        body: {
          properties: {
            preferredOsType: OsType.Linux,
            preferredShellType: ShellType.Bash,
            preferredLocation: "eastus",
            networkType: NetworkType.Default,
            sessionType: SessionType.Ephemeral,
            userSubscription: "sub-id",
            vnetSettings: {},
          },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should call armRequest with isolated network settings", async () => {
      const mockVNetSettings = { subnetId: "test-subnet" };
      const mockResponse = { id: "settings-id" };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      await putEphemeralUserSettings("sub-id", "eastus", mockVNetSettings);

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/providers/Microsoft.Portal/userSettings/cloudconsole",
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        body: {
          properties: {
            preferredOsType: OsType.Linux,
            preferredShellType: ShellType.Bash,
            preferredLocation: "eastus",
            networkType: NetworkType.Isolated,
            sessionType: SessionType.Ephemeral,
            userSubscription: "sub-id",
            vnetSettings: mockVNetSettings,
          },
        },
      });
    });

    it("should handle errors when updating settings fails", async () => {
      const mockError = new Error("Failed to update user settings");
      (armRequest as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(putEphemeralUserSettings("sub-id", "eastus")).rejects.toThrow("Failed to update user settings");

      expect(armRequest).toHaveBeenCalled();
    });
  });

  describe("verifyCloudShellProviderRegistration", () => {
    it("should call armRequest with correct parameters", async () => {
      const mockResponse = { registrationState: "Registered" };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await verifyCloudShellProviderRegistration("sub-id");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/subscriptions/sub-id/providers/Microsoft.CloudShell",
        method: "GET",
        apiVersion: "2022-12-01",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when verification fails", async () => {
      const mockError = new Error("Failed to verify provider registration");
      (armRequest as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(verifyCloudShellProviderRegistration("sub-id")).rejects.toThrow(
        "Failed to verify provider registration",
      );

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/subscriptions/sub-id/providers/Microsoft.CloudShell",
        method: "GET",
        apiVersion: "2022-12-01",
      });
    });
  });

  describe("registerCloudShellProvider", () => {
    it("should call armRequest with correct parameters", async () => {
      const mockResponse = { operationId: "op-id" };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await registerCloudShellProvider("sub-id");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/subscriptions/sub-id/providers/Microsoft.CloudShell/register",
        method: "POST",
        apiVersion: "2022-12-01",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when registration fails", async () => {
      const mockError = new Error("Failed to register provider");
      (armRequest as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(registerCloudShellProvider("sub-id")).rejects.toThrow("Failed to register provider");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "/subscriptions/sub-id/providers/Microsoft.CloudShell/register",
        method: "POST",
        apiVersion: "2022-12-01",
      });
    });
  });

  describe("provisionConsole", () => {
    it("should call armRequest with correct parameters", async () => {
      const mockResponse = { uri: "https://shell.azure.com/console123" };
      (armRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await provisionConsole("eastus");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "providers/Microsoft.Portal/consoles/default",
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        customHeaders: {
          "x-ms-console-preferred-location": "eastus",
        },
        body: {
          properties: {
            osType: OsType.Linux,
          },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when console provisioning fails", async () => {
      const mockError = new Error("Failed to provision console");
      (armRequest as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(provisionConsole("eastus")).rejects.toThrow("Failed to provision console");

      expect(armRequest).toHaveBeenCalledWith({
        host: MOCK_ARM_ENDPOINT,
        path: "providers/Microsoft.Portal/consoles/default",
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        customHeaders: {
          "x-ms-console-preferred-location": "eastus",
        },
        body: {
          properties: {
            osType: OsType.Linux,
          },
        },
      });
    });
  });

  describe("connectTerminal", () => {
    it("should call fetch with correct parameters", async () => {
      const consoleUri = "https://shell.azure.com/console123";
      const size = { rows: 24, cols: 80 };
      const mockTerminalResponse = { id: "terminal-id", socketUri: "wss://shell.azure.com/socket" };

      // Setup the mock response
      mockJsonPromise.mockResolvedValueOnce(mockTerminalResponse);

      const result = await connectTerminal(consoleUri, size);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://shell.azure.com/console123/terminals?cols=80&rows=24&version=2019-01-01&shell=bash",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Content-Length": "2",
            Authorization: "Bearer mock-token",
            "x-ms-client-request-id": "mocked-uuid",
            "Accept-Language": "en-US",
          },
          body: "{}",
        },
      );
      expect(mockJsonPromise).toHaveBeenCalled();
      expect(result).toEqual(mockTerminalResponse);
    });

    it("should handle errors when terminal connection fails", async () => {
      const consoleUri = "https://shell.azure.com/console123";
      const size = { rows: 24, cols: 80 };

      // Mock fetch to return a failed response
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: jest.fn().mockRejectedValue(new Error("Failed to parse JSON")),
          text: jest.fn().mockResolvedValue("Server Error"),
          headers: new Headers(),
        } as unknown as Promise<Response>;
      });

      await expect(connectTerminal(consoleUri, size)).rejects.toThrow(
        "Failed to connect to terminal: 500 Internal Server Error",
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "https://shell.azure.com/console123/terminals?cols=80&rows=24&version=2019-01-01&shell=bash",
        expect.any(Object),
      );
    });
  });

  describe("authorizeSession", () => {
    it("should call fetch with correct parameters", async () => {
      const consoleUri = "https://shell.azure.com/console123";
      const mockAuthResponse = {
        token: "auth-token",
      };

      // Create a separate mockJsonPromise specific to this test
      const authMockJsonPromise = jest.fn().mockResolvedValue(mockAuthResponse);

      // Override the global fetch for this specific test
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return {
          ok: true,
          status: 200,
          json: authMockJsonPromise,
          text: jest.fn().mockResolvedValue(""),
          headers: new Headers(),
        } as unknown as Promise<Response>;
      });

      const result = await authorizeSession(consoleUri);

      expect(global.fetch).toHaveBeenCalledWith("https://shell.azure.com/console123/authorize", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer mock-token",
          "Accept-Language": getLocale(),
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      expect(authMockJsonPromise).toHaveBeenCalled();
      expect(result).toEqual(mockAuthResponse);
    });

    it("should handle errors when session authorization fails", async () => {
      const consoleUri = "https://shell.azure.com/console123";

      // Mock fetch to return a failed response
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: jest.fn().mockRejectedValue(new Error("Failed to parse JSON")),
          text: jest.fn().mockResolvedValue("Unauthorized"),
          headers: new Headers(),
        } as unknown as Promise<Response>;
      });

      await expect(authorizeSession(consoleUri)).rejects.toThrow("Failed to authorize session: 401 Unauthorized");

      expect(global.fetch).toHaveBeenCalledWith("https://shell.azure.com/console123/authorize", expect.any(Object));
    });
  });
});
