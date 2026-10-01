jest.mock("Utils/arm/generatedClients/cosmos/databaseAccounts");
jest.mock("Utils/NotificationConsoleUtils", () => ({
  logConsoleProgress: jest.fn(() => jest.fn()), // returns a clearMessage fn
  logConsoleInfo: jest.fn(),
  logConsoleError: jest.fn(),
}));
jest.mock("Shared/Telemetry/TelemetryProcessor");

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { AuthType } from "../AuthType";
import { readDatabaseOffer } from "../Common/dataAccess/readDatabaseOffer";
import { Capability, DatabaseAccount } from "../Contracts/DataModels";
import { Database } from "../Contracts/ViewModels";
import { useNotificationConsole } from "../hooks/useNotificationConsole";
import { useSidePanel } from "../hooks/useSidePanel";
import { updateUserContext, userContext } from "../UserContext";
import { update } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import PromiseSource from "../Utils/PromiseSource";
import Explorer from "./Explorer";
import { useCommandBar } from "./Menus/CommandBar/CommandBarComponentAdapter";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel/AddCollectionPanel";
import { SidePanel } from "./Panes/PanelContainerComponent";
import { useDatabases } from "./useDatabases";

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
    useCommandBar.getState().setIsSynapseLinkUpdating(false);
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

    it("should track Synapse Link update progress in the command bar store", async () => {
      mockUpdate.mockImplementation(async () => {
        expect(useCommandBar.getState().isSynapseLinkUpdating).toBe(true);
        return {} as Awaited<ReturnType<typeof update>>;
      });
      explorer.openEnableSynapseLinkDialog();

      const dialogProps = mockOpenDialog.mock.calls[0][0];
      await dialogProps.onPrimaryButtonClick();

      expect(useCommandBar.getState().isSynapseLinkUpdating).toBe(false);
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

describe("Explorer.onNewCollectionClicked", () => {
  let explorer: Explorer;
  let originalContext: typeof userContext;
  let originalDatabases: ReturnType<typeof useDatabases.getState>;
  let originalPanel: ReturnType<typeof useSidePanel.getState>;
  let originalConsole: ReturnType<typeof useNotificationConsole.getState>;

  beforeEach(() => {
    originalContext = { ...userContext };
    originalDatabases = useDatabases.getState();
    originalPanel = useSidePanel.getState();
    originalConsole = useNotificationConsole.getState();
    updateUserContext({
      apiType: "SQL",
      databaseAccount: {
        id: "test-account",
        name: "test-account",
        location: "West US 2",
        type: "Microsoft.DocumentDB/databaseAccounts",
        kind: "GlobalDocumentDB",
        properties: {
          documentEndpoint: "https://test-account.documents.azure.com/",
          capabilities: [],
          enableMultipleWriteLocations: false,
        },
      },
    });
    useDatabases.setState({ databases: [] });
    useSidePanel.setState({ isOpen: false, headerText: undefined, panelContent: undefined });
    explorer = new Explorer();
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    updateUserContext(originalContext);
    useDatabases.setState(originalDatabases, true);
    useSidePanel.setState(originalPanel, true);
    useNotificationConsole.setState(originalConsole, true);
  });

  it("opens a loading panel immediately and waits before showing the form", async () => {
    const delayedOffers = new PromiseSource();
    const loadOffers = jest
      .spyOn(useDatabases.getState(), "loadDatabaseOffers")
      .mockImplementation(() => delayedOffers.promise);
    const view = render(React.createElement(SidePanel));

    let opening: Promise<void>;
    act(() => {
      opening = explorer.onNewCollectionClicked();
    });
    expect(loadOffers).toHaveBeenCalledTimes(1);
    expect(view.getByRole("heading", { name: "New Container" })).not.toBeNull();
    expect(view.getByRole("progressbar")).not.toBeNull();
    expect(view.queryByRole("radio", { name: /Create new/i })).toBeNull();

    await act(async () => {
      delayedOffers.resolve();
      await opening;
    });
    expect(view.queryByRole("progressbar")).toBeNull();
    expect(view.getByRole("radio", { name: /Create new/i })).not.toBeNull();
    expect(document.querySelector('[data-test="Panel:New Container"]')).not.toBeNull();
  });

  it("shows a retryable error without the form when an unrelated database offer fails", async () => {
    const failure = new Error("Unrelated database offer failed");
    const selectedOffer = jest.fn().mockResolvedValue(undefined);
    const unrelatedOffer = jest.fn().mockRejectedValue(failure);
    useDatabases.setState({
      databases: [
        { id: () => "selected-db", loadOffer: selectedOffer } as unknown as Database,
        { id: () => "other-run-db", loadOffer: unrelatedOffer } as unknown as Database,
      ],
    });

    const view = render(React.createElement(SidePanel));
    await act(async () => {
      await explorer.onNewCollectionClicked({ databaseId: "selected-db" });
    });
    expect(selectedOffer).toHaveBeenCalledTimes(1);
    expect(unrelatedOffer).toHaveBeenCalledTimes(1);
    expect(useSidePanel.getState().isOpen).toBe(true);
    expect(view.getByRole("alert").textContent).toContain("Unable to load throughput settings. Try again.");
    expect(view.getByRole("button", { name: "Retry" })).not.toBeNull();
    expect(view.queryByRole("progressbar")).toBeNull();
    expect(view.queryByRole("radio", { name: /Use existing/i })).toBeNull();
  });

  it("restores console space after a console-disabled panel and exposes error details", async () => {
    useSidePanel.getState().setPanelHasConsole(false);
    useNotificationConsole.setState({ isExpanded: false, consoleAnimationFinished: false });
    jest.spyOn(useDatabases.getState(), "loadDatabaseOffers").mockRejectedValue(new Error("Offer unavailable"));
    const view = render(React.createElement(SidePanel));

    await act(async () => {
      await explorer.onNewCollectionClicked();
    });

    expect(useSidePanel.getState().hasConsole).toBe(true);
    const panel = document.querySelector<HTMLElement>('[data-test="Panel:New Container"]');
    expect(panel?.style.height).toBe(`${window.innerHeight - 32}px`);
    fireEvent.click(view.getByRole("button", { name: /more details/i }));
    expect(useNotificationConsole.getState().isExpanded).toBe(true);
    expect(panel?.style.height).toBe(`${window.innerHeight - 32 - 220}px`);
  });

  it("retries loading and preserves the requested database before showing the form", async () => {
    const retryOffers = new PromiseSource();
    const loadOffers = jest
      .spyOn(useDatabases.getState(), "loadDatabaseOffers")
      .mockRejectedValueOnce(new Error("Offer unavailable"))
      .mockImplementationOnce(() => retryOffers.promise);
    const view = render(React.createElement(SidePanel));

    await act(async () => {
      await explorer.onNewCollectionClicked({ databaseId: "selected-db", isQuickstart: false });
    });
    fireEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(loadOffers).toHaveBeenCalledTimes(2);
    expect(view.getByRole("progressbar")).not.toBeNull();
    expect(view.queryByRole("alert")).toBeNull();
    expect(view.queryByRole("button", { name: "Retry" })).toBeNull();
    expect(view.queryByRole("radio", { name: /Use existing/i })).toBeNull();

    await act(async () => {
      retryOffers.resolve();
      await retryOffers.promise;
    });
    expect(view.queryByRole("progressbar")).toBeNull();
    expect(view.getByRole("radio", { name: /Use existing/i })).not.toBeNull();
    expect(useSidePanel.getState().panelContent?.props).toMatchObject({
      explorer,
      databaseId: "selected-db",
      isQuickstart: false,
    });
  });

  it.each([true, false])("does not reopen a dismissed panel after loading settles (success=%s)", async (success) => {
    const delayedOffers = new PromiseSource();
    jest.spyOn(useDatabases.getState(), "loadDatabaseOffers").mockImplementation(() => delayedOffers.promise);
    const opening = explorer.onNewCollectionClicked();
    const loadingContent = useSidePanel.getState().panelContent;
    useSidePanel.getState().closeSidePanel();

    success ? delayedOffers.resolve() : delayedOffers.reject(new Error("Offer unavailable"));
    await opening;
    expect(useSidePanel.getState().isOpen).toBe(false);
    expect(useSidePanel.getState().panelContent).toBe(loadingContent);
  });

  it.each([true, false])("does not replace a newer panel after loading settles (success=%s)", async (success) => {
    const delayedOffers = new PromiseSource();
    jest.spyOn(useDatabases.getState(), "loadDatabaseOffers").mockImplementation(() => delayedOffers.promise);
    const opening = explorer.onNewCollectionClicked();
    const newerContent = React.createElement("div");
    useSidePanel.getState().openSidePanel("Another panel", newerContent);

    success ? delayedOffers.resolve() : delayedOffers.reject(new Error("Offer unavailable"));
    await opening;
    expect(useSidePanel.getState().isOpen).toBe(true);
    expect(useSidePanel.getState().headerText).toBe("Another panel");
    expect(useSidePanel.getState().panelContent).toBe(newerContent);
  });

  it.each([undefined, -1, 10000])("loads collection offers only for a finite account cap (%s)", async (limit) => {
    const collectionOffer = jest.fn().mockResolvedValue(undefined);
    const loadCollections = jest.fn().mockResolvedValue(undefined);
    const loadOffer = jest.fn().mockResolvedValue(undefined);
    userContext.databaseAccount!.properties.capacity =
      limit === undefined ? undefined : { totalThroughputLimit: limit };
    useDatabases.setState({
      databases: [
        {
          loadOffer,
          loadCollections,
          collections: () => [{ loadOffer: collectionOffer }],
        } as unknown as Database,
      ],
    });

    await explorer.onNewCollectionClicked();
    expect(loadOffer).toHaveBeenCalledTimes(1);
    expect(loadCollections).toHaveBeenCalledTimes(limit === 10000 ? 1 : 0);
    expect(collectionOffer).toHaveBeenCalledTimes(limit === 10000 ? 1 : 0);
    expect(useSidePanel.getState().isOpen).toBe(true);
  });

  it.each([
    { status: 404, code: "NotFound", opens: true },
    { status: 404, code: "ResourceNotFound", opens: false },
    { status: 429, code: "TooManyRequests", opens: false },
    { status: 403, code: "Forbidden", opens: false },
  ])("keeps the panel open after ARM $status/$code but gates the form", async ({ status, code, opens }) => {
    updateUserContext({
      authType: AuthType.AAD,
      authorizationToken: "Bearer diagnostic-token",
      subscriptionId: "test-subscription",
      resourceGroup: "test-resource-group",
      features: { ...userContext.features, enableSDKoperations: false },
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockClear()
      .mockResolvedValue({
        ok: false,
        status,
        headers: { get: (name: string) => (name.toLowerCase() === "retry-after" ? "0" : null) },
        json: async () => ({ error: { code, message: "Diagnostic offer response" } }),
      } as Response);
    useDatabases.setState({
      databases: [
        {
          loadOffer: () => readDatabaseOffer({ databaseId: "other-run-db", databaseResourceId: "dbs/other" }),
        } as unknown as Database,
      ],
    });

    await expect(explorer.onNewCollectionClicked()).resolves.toBeUndefined();
    const offerRequests = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/sqlDatabases/other-run-db/throughputSettings/default"),
    );
    expect(offerRequests).toHaveLength(status === 429 ? 3 : 1);
    expect(useSidePanel.getState().isOpen).toBe(true);
    expect(useSidePanel.getState().panelContent?.type === AddCollectionPanel).toBe(opens);
  });
});
