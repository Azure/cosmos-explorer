jest.mock("../../../hooks/useDirectories");
jest.mock("Common/CosmosClient", () => ({
  client: jest.fn(),
}));
jest.mock("Common/Logger", () => ({
  logWarning: jest.fn(),
}));
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { client } from "Common/CosmosClient";
import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { updateUserContext, userContext } from "UserContext";
import React from "react";
import { AccessInputMetadata } from "../../../Contracts/DataModels";
import { ConnectExplorer, validateDirectConnectionStringConnectivity } from "./ConnectExplorer";

it("shows the connect form", () => {
  const connectionString = "fakeConnectionString";
  const login = jest.fn();
  const setConnectionString = jest.fn();
  const setEncryptedToken = jest.fn();
  const setAuthType = jest.fn();
  const setAccountMetadata = jest.fn();
  const setErrorMessage = jest.fn();

  render(
    <ConnectExplorer
      {...{
        login,
        setEncryptedToken,
        setAuthType,
        connectionString,
        setConnectionString,
        setAccountMetadata,
        setErrorMessage,
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
  const setErrorMessage = jest.fn();
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
        setErrorMessage,
      }}
    />,
  );
  expect(screen.queryByPlaceholderText("Connect to your account with connection string")).toBeNull();

  updateUserContext({ features: oldFeatures });
});

describe("validateDirectConnectionStringConnectivity", () => {
  const connectionString = "AccountEndpoint=https://test.documents.azure.com:443/;AccountKey=fakeKey==;";
  const metadata = { documentEndpoint: "https://test.documents.azure.com:443/" } as AccessInputMetadata;

  const mockGetDatabaseAccount = (getDatabaseAccount: () => Promise<unknown>) => {
    (client as jest.Mock).mockReturnValue({ getDatabaseAccount });
  };

  it.each([401, 403])("blocks the login and surfaces the error returned for a %i", async (statusCode) => {
    // The Cosmos SDK reports the HTTP status on `ErrorResponse.code`.
    const authorizationError = Object.assign(new Error("The input authorization token is invalid"), {
      code: statusCode,
    });
    mockGetDatabaseAccount(() => Promise.reject(authorizationError));

    await expect(validateDirectConnectionStringConnectivity(connectionString, metadata)).rejects.toBe(
      authorizationError,
    );
  });

  it.each([429, 503])("does not block the login for a %i", async (statusCode) => {
    mockGetDatabaseAccount(() => Promise.reject(Object.assign(new Error("Service unavailable"), { code: statusCode })));

    await expect(validateDirectConnectionStringConnectivity(connectionString, metadata)).resolves.toBeUndefined();
  });

  it("does not block the login when the account is unreachable", async () => {
    mockGetDatabaseAccount(() => Promise.reject(new Error("Failed to fetch")));

    await expect(validateDirectConnectionStringConnectivity(connectionString, metadata)).resolves.toBeUndefined();
  });

  it("allows the login when the account can be read", async () => {
    mockGetDatabaseAccount(() => Promise.resolve({}));

    await expect(validateDirectConnectionStringConnectivity(connectionString, metadata)).resolves.toBeUndefined();
  });
});
