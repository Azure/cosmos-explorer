jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
jest.mock("../Logger");
jest.mock("../ErrorHandlingUtils", () => ({ handleError: jest.fn() }));
jest.mock("../../Utils/NotificationConsoleUtils");
import * as Logger from "Common/Logger";
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { updateUserContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { readCollections } from "./readCollections";

describe("readCollections", () => {
  const clearMessage = jest.fn();
  const fetchAll = jest.fn();
  const readAll = jest.fn(() => ({ fetchAll }));
  const database = jest.fn(() => ({ containers: { readAll } }));
  const diagnostics = {
    clientSideRequestStatistics: {
      requestDurationInMs: 123,
      locationEndpointsContacted: ["https://test.documents.azure.com"],
      retryDiagnostics: { failedAttempts: [{ statusCode: 429 }] },
    },
    diagnosticNode: { data: { responsePayload: "not-for-logging" } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (logConsoleProgress as jest.Mock).mockReturnValue(clearMessage);
    (client as jest.Mock).mockReturnValue({ database });
    updateUserContext({ authType: AuthType.MasterKey });
  });

  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: "SQL",
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await readCollections("database");
    expect(armRequest).toHaveBeenCalled();
    expect(client).not.toHaveBeenCalled();
    expect(clearMessage).toHaveBeenCalledTimes(1);
  });

  it("should log SDK request statistics and return collections for non-AAD authentication", async () => {
    const resources = [{ id: "container" }];
    fetchAll.mockResolvedValue({ resources, diagnostics });

    await expect(readCollections("database")).resolves.toBe(resources);

    expect(database).toHaveBeenCalledWith("database");
    expect(readAll).toHaveBeenCalledWith();
    expect(fetchAll).toHaveBeenCalledTimes(1);
    expect(Logger.logInfo).toHaveBeenLastCalledWith(
      expect.stringContaining(`diagnostics=${JSON.stringify(diagnostics.clientSideRequestStatistics)}`),
      "readCollections",
    );
    expect(JSON.stringify(jest.mocked(Logger.logInfo).mock.calls)).not.toContain("not-for-logging");
    expect(clearMessage).toHaveBeenCalledTimes(1);
  });

  it("should log SDK failure statistics and rethrow the original error", async () => {
    const error = Object.assign(new Error("fetchAll failed"), { diagnostics });
    fetchAll.mockRejectedValue(error);

    await expect(readCollections("database")).rejects.toBe(error);

    expect(Logger.logError).toHaveBeenCalledWith(
      `readCollections: fetchAll failed for database database, diagnostics=${JSON.stringify(
        diagnostics.clientSideRequestStatistics,
      )}`,
      "readCollections",
    );
    expect(handleError).toHaveBeenCalledWith(
      error,
      "ReadCollections",
      "Error while querying containers for database database",
    );
    expect(clearMessage).toHaveBeenCalledTimes(1);
  });

  it("should preserve error handling when diagnostics are unavailable", async () => {
    const error = new Error("client initialization failed");
    (client as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });

    await expect(readCollections("database")).rejects.toBe(error);

    expect(Logger.logError).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(
      error,
      "ReadCollections",
      "Error while querying containers for database database",
    );
    expect(clearMessage).toHaveBeenCalledTimes(1);
  });
});
