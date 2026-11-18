jest.mock("./hooks/useAADAuth");
jest.mock("./hooks/useConfig");
jest.mock("./Common/PortalBackendClient");
jest.mock("./Platform/Hosted/TryCosmosDB/TryCosmosDB", () => ({
  ...jest.requireActual("./Platform/Hosted/TryCosmosDB/TryCosmosDB"),
  fetchTrialDetection: jest.fn(),
  extendTrial: jest.fn(),
}));
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
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { fetchAccessData, fetchEncryptedToken } from "./Common/PortalBackendClient";
import { useAADAuth } from "./hooks/useAADAuth";
import { useConfig } from "./hooks/useConfig";
import { App } from "./HostedExplorer";
import { ConnectExplorer } from "./Platform/Hosted/Components/ConnectExplorer";
import { fetchTrialDetection, extendTrial, TrialOperationError } from "./Platform/Hosted/TryCosmosDB/TryCosmosDB";
import { PortalBackendEndpoints } from "./Common/Constants";
import { ApiKind } from "./Contracts/DataModels";
import { HostedExplorerChildFrame } from "./HostedExplorerChildFrame";

const mockFetchEncryptedToken = fetchEncryptedToken as jest.MockedFunction<typeof fetchEncryptedToken>;

(ConnectExplorer as jest.Mock).mockImplementation(() => <div data-testid="connect-explorer" />);

import type { AccountInfo } from "@azure/msal-browser";
import type { AadAuthFailure } from "./hooks/useAADAuth";

const defaultAADAuth = {
  isLoggedIn: false,
  armToken: "",
  graphToken: "",
  account: undefined as AccountInfo | null | undefined,
  tenantId: "",
  logout: jest.fn(),
  login: jest.fn(),
  switchTenant: jest.fn(),
  authFailure: undefined as AadAuthFailure | null | undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAADAuth as jest.Mock).mockReturnValue(defaultAADAuth);
  (useConfig as jest.Mock).mockReturnValue({});
  (fetchAccessData as jest.Mock).mockResolvedValue(undefined);
  mockFetchEncryptedToken.mockResolvedValue("encrypted-token");
  jest.mocked(fetchTrialDetection).mockResolvedValue({ isTryCosmosDB: false });
  jest.mocked(extendTrial).mockResolvedValue({ timeLeftInSeconds: 2592000 });
});

const dispatchPostMessage = (data: unknown, origin: string) => {
  const event = new MessageEvent("message", { data, origin });
  window.dispatchEvent(event);
};

// Deliberately invalid account name
const FAKE_ACCOUNT_NAME: string = "-FakeAccount-";
const FAKE_KEY: string = "<redacted-test-key>";

const trialResource = {
  accountName: "trial-account",
  resourceGroupName: "trial-group",
  timeLeftInSeconds: 1800,
};
const trialConnection = `AccountEndpoint=https://${trialResource.accountName}.documents.azure.com/;AccountKey=${FAKE_KEY};`;
const trialAuth = {
  accountName: trialResource.accountName,
  resourceGroupName: trialResource.resourceGroupName,
  provider: "github",
  token: "test-owner-token",
  expiresAt: Date.now() + 3600000,
  backendEndpoint: PortalBackendEndpoints.Prod,
};
const connectTrial = async (ownerAuth?: unknown, source: Window | null = null) => {
  jest.mocked(fetchTrialDetection).mockResolvedValue({ isTryCosmosDB: true, trialResource });
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://cosmos.azure.com",
        source,
        data: { type: "tryCosmosDBConnectionString", connectionString: trialConnection, ownerAuth },
      }),
    );
  });
  await screen.findByRole("button", { name: "Extend sandbox" });
};

describe("Hosted SQL trial", () => {
  beforeEach(() => {
    jest.replaceProperty(process.env, "NODE_ENV", "development");
  });

  afterEach(() => {
    window.opener = null;
    jest.restoreAllMocks();
  });

  it("leaves non-trial SQL connections usable without trial controls", async () => {
    render(<App />);
    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: trialConnection },
        "https://cosmos.azure.com",
      );
    });
    expect(await screen.findByTitle("explorer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Extend sandbox" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry trial status" })).toBeNull();
  });

  it.each([
    {
      api: "Table",
      apiKind: ApiKind.Table,
      connectionString: `TableEndpoint=https://trial-account.table.cosmosdb.azure.com:443/;AccountKey=${FAKE_KEY};`,
    },
    {
      api: "MongoDB",
      apiKind: ApiKind.MongoDB,
      connectionString: `mongodb://trial-account:${FAKE_KEY}@trial-account.documents.azure.com:10255`,
    },
  ])("keeps $api data access working without Try detection or controls", async ({ apiKind, connectionString }) => {
    jest.mocked(fetchTrialDetection).mockResolvedValue({ isTryCosmosDB: true, trialResource });
    jest.mocked(fetchAccessData).mockResolvedValue({
      accountName: trialResource.accountName,
      apiKind,
      apiEndpoint: "https://trial-account.documents.azure.com/",
      documentEndpoint: "https://trial-account.documents.azure.com/",
      expiryTimestamp: new Date(trialAuth.expiresAt).toISOString(),
    });
    render(<App />);
    await act(async () => {
      dispatchPostMessage({ type: "tryCosmosDBConnectionString", connectionString }, "https://cosmos.azure.com");
    });
    expect(await screen.findByTitle("explorer")).toBeInTheDocument();
    expect(fetchTrialDetection).not.toHaveBeenCalled();
    expect(extendTrial).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Extend sandbox" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry trial status" })).toBeNull();
    expect(mockFetchEncryptedToken).toHaveBeenCalledTimes(apiKind === ApiKind.MongoDB ? 1 : 0);
  });

  it("extends with the trusted owner's handoff without another sign-in or iframe reload", async () => {
    window.opener = window;
    jest.spyOn(window, "postMessage").mockImplementation(() => {});
    render(<App />);
    await connectTrial(trialAuth, window);
    expect(fetchTrialDetection).toHaveBeenCalledWith(
      { accountName: trialResource.accountName, masterKey: FAKE_KEY, backendEndpoint: PortalBackendEndpoints.Prod },
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Time remaining: 30m")).toBeVisible();
    const frame = screen.getByTitle("explorer") as HTMLIFrameElement;
    const frameWindow = frame.contentWindow as HostedExplorerChildFrame;
    const postToFrame = jest.spyOn(frameWindow, "postMessage");
    fireEvent.load(frame);
    expect(JSON.stringify(frameWindow.hostedConfig)).not.toContain(trialAuth.token);
    fireEvent.click(screen.getByRole("button", { name: "Extend sandbox" }));
    expect(screen.getByRole("button", { name: "Extend sandbox" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Sandbox operation in progress");
    expect(await screen.findByText("Time remaining: 30d")).toBeVisible();
    expect(postToFrame).not.toHaveBeenCalled();
    expect(extendTrial).toHaveBeenCalledWith(
      expect.objectContaining({ resourceGroupName: trialResource.resourceGroupName }),
      trialAuth,
    );
    expect(screen.getByRole("button", { name: "Extend sandbox" })).not.toHaveAttribute("href");
    expect(screen.queryByRole("button", { name: "Delete sandbox" })).toBeNull();
    expect(screen.getByTitle("explorer")).toBe(frame);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(fetchTrialDetection).toHaveBeenCalledTimes(1);
  });

  it("opens Portal on the first click after owner credentials expire and refreshes on return", async () => {
    window.opener = window;
    jest.spyOn(window, "postMessage").mockImplementation(() => {});
    const open = jest.spyOn(window, "open").mockReturnValue(null);
    const ownerAuth = { ...trialAuth, expiresAt: Date.now() + 60000 };
    render(<App />);
    await connectTrial(ownerAuth, window);
    const frame = screen.getByTitle("explorer");
    const control = screen.getByRole("button", { name: "Extend sandbox" });
    expect(control).not.toHaveAttribute("href");
    jest.spyOn(Date, "now").mockReturnValue(ownerAuth.expiresAt);
    fireEvent.click(control);
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("resourceGroupName=trial-group"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(extendTrial).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Retry trial status" })).toBeNull();
    jest.mocked(fetchTrialDetection).mockResolvedValue({
      isTryCosmosDB: true,
      trialResource: { ...trialResource, timeLeftInSeconds: 2592000 },
    });
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(await screen.findByText("Time remaining: 30d")).toBeVisible();
    expect(screen.getByTitle("explorer")).toBe(frame);
  });

  it("does not accept owner auth from an arbitrary allowed-origin window", async () => {
    window.opener = window;
    jest.spyOn(window, "postMessage").mockImplementation(() => {});
    render(<App />);
    await connectTrial(trialAuth);
    fireEvent.click(screen.getByRole("button", { name: "Extend sandbox" }));
    expect(screen.getByRole("button", { name: "Extend sandbox" })).toHaveAttribute("target", "_blank");
    expect(extendTrial).not.toHaveBeenCalled();
  });

  it("preserves the active session on failed extension and discards rejected auth for fallback", async () => {
    window.opener = window;
    jest.spyOn(window, "postMessage").mockImplementation(() => {});
    jest.mocked(extendTrial).mockRejectedValue(new TrialOperationError("Sign in again to manage this sandbox.", true));
    render(<App />);
    await connectTrial(trialAuth, window);
    const frame = screen.getByTitle("explorer");
    fireEvent.click(screen.getByRole("button", { name: "Extend sandbox" }));
    expect(await screen.findByRole("button", { name: "Retry trial status" })).toHaveAttribute(
      "title",
      "Sign in again to manage this sandbox.",
    );
    expect(screen.getByTitle("explorer")).toBe(frame);
    fireEvent.click(screen.getByRole("button", { name: "Extend sandbox" }));
    expect(screen.getByRole("button", { name: "Extend sandbox" })).toHaveAttribute("target", "_blank");
    expect(extendTrial).toHaveBeenCalledTimes(1);
  });

  it("keeps detection failures non-blocking and exposes retry instead of trial controls", async () => {
    jest.mocked(fetchTrialDetection).mockRejectedValue(new Error("Trial status unavailable."));
    render(<App />);
    await act(async () =>
      dispatchPostMessage(
        {
          type: "tryCosmosDBConnectionString",
          connectionString: trialConnection,
        },
        "https://cosmos.azure.com",
      ),
    );
    await screen.findByRole("button", { name: "Retry trial status" });
    expect(screen.getByTitle("explorer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Extend sandbox" })).toBeNull();
    jest.mocked(fetchTrialDetection).mockResolvedValue({ isTryCosmosDB: true, trialResource });
    fireEvent.click(screen.getByRole("button", { name: "Retry trial status" }));
    expect(await screen.findByText("Time remaining: 30m")).toBeVisible();
  });

  it("links to Portal and refreshes the countdown on return without reloading Explorer", async () => {
    render(<App />);
    await connectTrial();
    const frame = screen.getByTitle("explorer");
    const control = screen.getByRole("button", { name: "Extend sandbox" });
    expect(control).toHaveAttribute("href", expect.stringContaining("resourceGroupName=trial-group"));
    expect(control).toHaveAttribute("href", expect.stringContaining("#extend"));
    expect(control).toHaveAttribute("target", "_blank");
    fireEvent.click(control);
    jest.mocked(fetchTrialDetection).mockResolvedValue({
      isTryCosmosDB: true,
      trialResource: { ...trialResource, timeLeftInSeconds: 2592000 },
    });
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(await screen.findByText("Time remaining: 30d")).toBeVisible();
    expect(fetchTrialDetection).toHaveBeenCalledTimes(2);
    expect(screen.getByTitle("explorer")).toBe(frame);
    expect(extendTrial).not.toHaveBeenCalled();
  });
});

describe("HostedExplorer tryCosmosDB postMessage handler", () => {
  it("accepts a parsed SQL connection string without an arbitrary length limit", async () => {
    render(<App />);

    const validConnStr = `${trialConnection}ApplicationName=${"a".repeat(65536)};`;

    await act(async () => {
      dispatchPostMessage(
        { type: "tryCosmosDBConnectionString", connectionString: validConnStr },
        "https://cosmos.azure.com",
      );
      await Promise.resolve();
    });

    expect(await screen.findByTitle("explorer")).toBeInTheDocument();
    expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
  });

  it("rejects messages from a disallowed origin", async () => {
    render(<App />);

    const validConnStr = `AccountEndpoint=https://${FAKE_ACCOUNT_NAME}.documents.azure.com:443/;AccountKey=${FAKE_KEY};`;

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

    const validConnStr = `AccountEndpoint=https://${FAKE_ACCOUNT_NAME}.documents.azure.com:443/;AccountKey=${FAKE_KEY};`;

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
