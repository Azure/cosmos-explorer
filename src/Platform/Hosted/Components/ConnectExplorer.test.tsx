jest.mock("../../../hooks/useDirectories");
jest.mock("../../../Common/PortalBackendClient");
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { updateUserContext, userContext } from "UserContext";
import React from "react";
import { fetchEncryptedToken, isAccountRestrictedForConnectionStringLogin } from "../../../Common/PortalBackendClient";
import { ConnectExplorer } from "./ConnectExplorer";

const mockFetchEncryptedToken = fetchEncryptedToken as jest.MockedFunction<typeof fetchEncryptedToken>;
const mockIsAccountRestricted = isAccountRestrictedForConnectionStringLogin as jest.MockedFunction<
  typeof isAccountRestrictedForConnectionStringLogin
>;

// fetchEncryptedToken rejects with the raw Response.
const rejectWithResponse = (status: number, body: string) =>
  mockFetchEncryptedToken.mockRejectedValue({ status, text: async () => body } as Response);

beforeEach(() => {
  jest.resetAllMocks();
  mockIsAccountRestricted.mockResolvedValue(false);
});

it("shows the connect form", () => {
  const connectionString = "fakeConnectionString";
  const login = jest.fn();
  const setConnectionString = jest.fn();
  const setEncryptedToken = jest.fn();
  const setAuthType = jest.fn();
  const setAccountMetadata = jest.fn();

  render(
    <ConnectExplorer
      {...{
        login,
        setEncryptedToken,
        setAuthType,
        connectionString,
        setConnectionString,
        setAccountMetadata,
      }}
    />,
  );
  expect(screen.queryByPlaceholderText("Please enter a connection string")).toBeNull();
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  expect(screen.queryByPlaceholderText("Please enter a connection string")).toBeDefined();
});

it("hides the connection string link when feature.disableConnectionStringLogin is true", () => {
  const connectionString = "fakeConnectionString";
  const login = jest.fn();
  const setConnectionString = jest.fn();
  const setEncryptedToken = jest.fn();
  const setAuthType = jest.fn();
  const setAccountMetadata = jest.fn();
  const oldFeatures = userContext.features;

  const params = new URLSearchParams({
    "feature.disableConnectionStringLogin": "true",
  });

  const testFeatures = extractFeatures(params);
  updateUserContext({ features: testFeatures });

  render(
    <ConnectExplorer
      {...{
        login,
        setEncryptedToken,
        setAuthType,
        connectionString,
        setConnectionString,
        setAccountMetadata,
      }}
    />,
  );
  expect(screen.queryByPlaceholderText("Connect to your account with connection string")).toBeNull();

  updateUserContext({ features: oldFeatures });
});

it("rejects an unrecognized connection string before token exchange", async () => {
  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: "not-a-valid-connection-string",
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  expect(
    await screen.findByText(
      "We couldn't recognize this connection string. Verify that it is a valid Azure Cosmos DB connection string and try again.",
    ),
  ).toBeInTheDocument();
  expect(mockIsAccountRestricted).not.toHaveBeenCalled();
  expect(mockFetchEncryptedToken).not.toHaveBeenCalled();
});

it("shows that a connection is in progress", async () => {
  let finishRestrictionCheck: (restricted: boolean) => void = () => undefined;
  mockIsAccountRestricted.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRestrictionCheck = resolve;
      }),
  );

  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: "AccountEndpoint=https://test.documents.azure.com:443/;AccountKey=some-key;",
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  const connectButton = screen.getByDisplayValue("Connecting...");
  expect(connectButton).toBeDisabled();
  expect(connectButton.closest("form")).toHaveAttribute("aria-busy", "true");

  finishRestrictionCheck(false);
  expect(await screen.findByDisplayValue("Connect")).toBeEnabled();
});

it("shows the error when the Portal Backend rejects the connection string", async () => {
  // Mongo and Cassandra are the APIs that still exchange the connection string for an encrypted token.
  const mongoConnectionString = "mongodb://test:key@test.documents.azure.com:10255";
  rejectWithResponse(403, "Request originated from IP 1.2.3.4 through public internet.");

  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: mongoConnectionString,
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  expect(
    await screen.findByText(
      "Couldn't authenticate with Cosmos DB: Request originated from IP 1.2.3.4 through public internet.",
    ),
  ).toBeInTheDocument();
});

it("shows a generic error when the Portal Backend fails without a message", async () => {
  const mongoConnectionString = "mongodb://test:key@test.documents.azure.com:10255";
  // A failure with an empty body leaves nothing worth rendering.
  rejectWithResponse(500, "");

  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: mongoConnectionString,
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  expect(
    await screen.findByText("Failed to connect to the account. Please check the connection string and try again."),
  ).toBeInTheDocument();
});

it("offers the firewall help link when the Portal Backend is blocked by the account firewall", async () => {
  const mongoConnectionString = "mongodb://test:key@test.documents.azure.com:10255";
  rejectWithResponse(403, "Request originated from IP 1.2.3.4 through public internet.");

  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: mongoConnectionString,
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  expect(await screen.findByText("Allow access from Azure Portal")).toBeInTheDocument();
});

it("does not offer the firewall help link for a failure the firewall did not cause", async () => {
  const mongoConnectionString = "mongodb://test:key@test.documents.azure.com:10255";
  rejectWithResponse(401, "The connection string is invalid.");

  render(
    <ConnectExplorer
      {...{
        login: jest.fn(),
        setEncryptedToken: jest.fn(),
        setAuthType: jest.fn(),
        connectionString: mongoConnectionString,
        setConnectionString: jest.fn(),
        setAccountMetadata: jest.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  fireEvent.click(screen.getByDisplayValue("Connect"));

  expect(
    await screen.findByText("Couldn't authenticate with Cosmos DB: The connection string is invalid."),
  ).toBeInTheDocument();
  expect(screen.queryByText("Allow access from Azure Portal")).toBeNull();
});
