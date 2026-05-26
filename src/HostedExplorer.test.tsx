jest.mock("./hooks/useAADAuth");
jest.mock("./hooks/useConfig");
jest.mock("./hooks/usePortalAccessToken");
jest.mock("./Platform/Hosted/Components/ConnectExplorer");
jest.mock("./Shared/appInsights");
jest.mock("./Platform/Hosted/Components/AccountSwitcher", () => ({
  AccountSwitcher: () => null,
}));
jest.mock("./Platform/Hosted/Components/DirectoryPickerPanel", () => ({
  DirectoryPickerPanel: () => null,
}));
jest.mock("./Platform/Hosted/Components/FeedbackCommandButton", () => ({
  FeedbackCommandButton: () => null,
}));
jest.mock("./Platform/Hosted/Components/MeControl", () => ({
  MeControl: () => null,
}));
jest.mock("./Platform/Hosted/Components/SignInButton", () => ({
  SignInButton: () => null,
}));
jest.mock("./Platform/Hosted/Components/AadAuthorizationFailure", () => ({
  AadAuthorizationFailure: () => null,
}));

import "@testing-library/jest-dom";
import { act, render } from "@testing-library/react";
import React from "react";
import { useAADAuth } from "./hooks/useAADAuth";
import { useConfig } from "./hooks/useConfig";
import { useTokenMetadata } from "./hooks/usePortalAccessToken";
import { App } from "./HostedExplorer";
import { ConnectExplorer, fetchEncryptedToken } from "./Platform/Hosted/Components/ConnectExplorer";

const mockFetchEncryptedToken = fetchEncryptedToken as jest.MockedFunction<typeof fetchEncryptedToken>;

(ConnectExplorer as jest.Mock).mockImplementation(() => <div data-testid="connect-explorer" />);

const defaultAADAuth = {
  isLoggedIn: false,
  armToken: "",
  graphToken: "",
  account: undefined,
  tenantId: "",
  logout: jest.fn(),
  login: jest.fn(),
  switchTenant: jest.fn(),
  authFailure: undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAADAuth as jest.Mock).mockReturnValue(defaultAADAuth);
  (useConfig as jest.Mock).mockReturnValue({});
  (useTokenMetadata as jest.Mock).mockReturnValue(undefined);
  mockFetchEncryptedToken.mockResolvedValue("encrypted-token");
});

const dispatchPostMessage = (data: unknown, origin: string) => {
  const event = new MessageEvent("message", { data, origin });
  window.dispatchEvent(event);
};

describe("HostedExplorer tryCosmosDB postMessage handler", () => {
  it("accepts a valid SQL connection string from an allowed origin", async () => {
    render(<App />);

    const validConnStr = "AccountEndpoint=https://myaccount.documents.azure.com:443/;AccountKey=dGVzdGtleQ==;";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: validConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(mockFetchEncryptedToken).toHaveBeenCalledWith(validConnStr);
  });

  it("accepts a valid Mongo connection string from an allowed origin", async () => {
    render(<App />);

    const mongoConnStr = "mongodb://myaccount:dGVzdGtleQ==@myaccount.documents.azure.com:10255";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: mongoConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(mockFetchEncryptedToken).toHaveBeenCalledWith(mongoConnStr);
  });

  it("accepts a valid Cassandra connection string from an allowed origin", async () => {
    render(<App />);

    const cassandraConnStr =
      "AccountEndpoint=https://myaccount.cassandra.cosmosdb.azure.com:443/;AccountKey=dGVzdGtleQ==;";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: cassandraConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(mockFetchEncryptedToken).toHaveBeenCalledWith(cassandraConnStr);
  });

  it("accepts a valid Table connection string from an allowed origin", async () => {
    render(<App />);

    const tableConnStr =
      "DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=dGVzdGtleQ==;TableEndpoint=https://myaccount.table.cosmosdb.azure.com:443/;";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: tableConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(mockFetchEncryptedToken).toHaveBeenCalledWith(tableConnStr);
  });

  it("accepts a valid Gremlin connection string from an allowed origin", async () => {
    render(<App />);

    const gremlinConnStr =
      "AccountEndpoint=https://myaccount.documents.azure.com:443/;AccountKey=dGVzdGtleQ==;ApiKind=Gremlin;";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: gremlinConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(mockFetchEncryptedToken).toHaveBeenCalledWith(gremlinConnStr);
  });

  it("rejects messages from a disallowed origin", async () => {
    render(<App />);

    const validConnStr = "AccountEndpoint=https://myaccount.documents.azure.com:443/;AccountKey=dGVzdGtleQ==;";

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: validConnStr },
        "https://evil.example.com",
      );
    });

    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("rejects messages with an invalid connection string format", async () => {
    render(<App />);

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: "not-a-real-connection-string" },
        "https://cosmos.azure.com",
      );
    });

    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("rejects messages with a non-string connection string value", async () => {
    render(<App />);

    await act(async () => {
      dispatchPostMessage({ type: "tryCosmosDBConnectionString", connectionString: 12345 }, "https://cosmos.azure.com");
    });

    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("rejects messages with a missing connection string", async () => {
    render(<App />);

    await act(async () => {
      dispatchPostMessage({ type: "tryCosmosDBConnectionString" }, "https://cosmos.azure.com");
    });

    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("ignores messages with an unrelated type", async () => {
    render(<App />);

    const validConnStr = "AccountEndpoint=https://myaccount.documents.azure.com:443/;AccountKey=dGVzdGtleQ==;";

    await act(async () => {
      dispatchPostMessage({ type: "someOtherMessage", connectionString: validConnStr }, "https://cosmos.azure.com");
    });

    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("sends tryCosmosDBReady to opener when present", () => {
    const mockPostMessage = jest.fn();
    const originalOpener = window.opener;
    Object.defineProperty(window, "opener", {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    render(<App />);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "tryCosmosDBReady" }, "https://cosmos.azure.com");

    Object.defineProperty(window, "opener", {
      value: originalOpener,
      writable: true,
      configurable: true,
    });
  });

  it("does not crash when there is no opener", () => {
    const originalOpener = window.opener;
    Object.defineProperty(window, "opener", {
      value: null,
      writable: true,
      configurable: true,
    });

    expect(() => render(<App />)).not.toThrow();

    Object.defineProperty(window, "opener", {
      value: originalOpener,
      writable: true,
      configurable: true,
    });
  });
});
