jest.mock("Utils/arm/generatedClients/cosmos/databaseAccounts");
jest.mock("Utils/NotificationConsoleUtils", () => ({
  logConsoleProgress: jest.fn(() => jest.fn()), // returns a clearMessage fn
  logConsoleInfo: jest.fn(),
  logConsoleError: jest.fn(),
}));
jest.mock("Shared/Telemetry/TelemetryProcessor");

import { Capability, DatabaseAccount } from "../Contracts/DataModels";
import { updateUserContext, userContext } from "../UserContext";
import { update } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import Explorer from "./Explorer";

const mockUpdate = update as jest.MockedFunction<typeof update>;

// Capture `useDialog.getState().openDialog` calls
const mockOpenDialog = jest.fn();
const mockCloseDialog = jest.fn();

jest.mock("./Controls/Dialog", () => ({
  useDialog: {
    getState: jest.fn(() => ({
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
    })),
  },
}));

// Silence useNotebook subscription calls
jest.mock("./Notebook/useNotebook", () => ({
  useNotebook: {
    subscribe: jest.fn(),
    getState: jest.fn().mockReturnValue(
      new Proxy(
        {},
        {
          get: () => jest.fn().mockResolvedValue(undefined),
        },
      ),
    ),
  },
}));

describe("Explorer.openEnableSynapseLinkDialog", () => {
  let explorer: Explorer;

  const baseAccount: DatabaseAccount = {
    id: "/subscriptions/ctx-sub/resourceGroups/ctx-rg/providers/Microsoft.DocumentDB/databaseAccounts/ctx-account",
    name: "ctx-account",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    tags: {},
    properties: {
      documentEndpoint: "https://ctx-account.documents.azure.com:443/",
      capabilities: [] as Capability[],
      enableMultipleWriteLocations: false,
    },
  };

  beforeAll(() => {
    updateUserContext({
      databaseAccount: baseAccount,
      subscriptionId: "ctx-sub",
      resourceGroup: "ctx-rg",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    explorer = new Explorer();
  });

  describe("without targetAccountOverride", () => {
    it("should open a dialog when called without override", () => {
      explorer.openEnableSynapseLinkDialog();
      expect(mockOpenDialog).toHaveBeenCalledTimes(1);
    });

    it("should use userContext values in the update call on primary button click", async () => {
      explorer.openEnableSynapseLinkDialog();

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      expect(mockUpdate).toHaveBeenCalledWith(
        "ctx-sub",
        "ctx-rg",
        "ctx-account",
        expect.objectContaining({
          properties: { enableAnalyticalStorage: true },
        }),
      );
    });

    it("should update userContext.databaseAccount.properties when no override is provided", async () => {
      explorer.openEnableSynapseLinkDialog();

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      expect(userContext.databaseAccount.properties.enableAnalyticalStorage).toBe(true);
    });
  });

  describe("with targetAccountOverride", () => {
    const override = {
      subscriptionId: "override-sub",
      resourceGroup: "override-rg",
      accountName: "override-account",
      capabilities: [] as Capability[],
    };

    it("should open a dialog when called with override", () => {
      explorer.openEnableSynapseLinkDialog(override);
      expect(mockOpenDialog).toHaveBeenCalledTimes(1);
    });

    it("should use override values in the update call on primary button click", async () => {
      explorer.openEnableSynapseLinkDialog(override);

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      expect(mockUpdate).toHaveBeenCalledWith(
        "override-sub",
        "override-rg",
        "override-account",
        expect.objectContaining({
          properties: { enableAnalyticalStorage: true },
        }),
      );
    });

    it("should NOT update userContext.databaseAccount.properties when override is provided", async () => {
      // Reset the property first
      userContext.databaseAccount.properties.enableAnalyticalStorage = false;

      explorer.openEnableSynapseLinkDialog(override);

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      expect(userContext.databaseAccount.properties.enableAnalyticalStorage).toBe(false);
    });

    it("should use override values — NOT userContext — even when userContext has different values", async () => {
      explorer.openEnableSynapseLinkDialog(override);

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      // update should NOT be called with ctx-sub / ctx-rg / ctx-account
      expect(mockUpdate).not.toHaveBeenCalledWith("ctx-sub", expect.anything(), expect.anything(), expect.anything());
    });
  });

  describe("secondary button click", () => {
    it("should close the dialog on secondary button click", () => {
      explorer.openEnableSynapseLinkDialog();

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      dialogProps.onSecondaryButtonClick();

      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });
  });
});
