import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { readDatabasesWithARM } from "Common/dataAccess/readDatabases";
import { configContext } from "ConfigContext";
import { AccountOverride, DatabaseAccount } from "Contracts/DataModels";
import { CopyJobMigrationType } from "Explorer/ContainerCopy/Enums/CopyJobEnums";
import { CopyJobContextProviderType } from "Explorer/ContainerCopy/Types/CopyJobTypes";
import Explorer from "Explorer/Explorer";
import { useSidePanel } from "hooks/useSidePanel";
import { Keys, t } from "Localization";
import React from "react";
import { updateUserContext, userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import AddCollectionPanelWrapper from "./AddCollectionPanelWrapper";

jest.mock("hooks/useSidePanel");
jest.mock("../../../Context/CopyJobContext");
jest.mock("Common/dataAccess/readDatabases", () => ({ readDatabasesWithARM: jest.fn() }));
jest.mock("Utils/arm/request", () => ({ armRequest: jest.fn() }));

jest.mock("../../../../Panes/AddCollectionPanel/AddCollectionPanel", () => ({
  AddCollectionPanel: ({
    explorer,
    isCopyJobFlow,
    onSubmitSuccess,
    targetAccountOverride,
  }: {
    explorer?: Explorer;
    isCopyJobFlow: boolean;
    onSubmitSuccess: (data: { databaseId: string; collectionId: string }) => void;
    targetAccountOverride?: AccountOverride;
  }) => (
    <div data-testid="add-collection-panel" data-target-account={JSON.stringify(targetAccountOverride)}>
      <div data-testid="explorer-prop">{explorer ? "explorer-present" : "no-explorer"}</div>
      <div data-testid="copy-job-flow">{isCopyJobFlow ? "true" : "false"}</div>
      <button
        data-testid="submit-button"
        onClick={() => onSubmitSuccess({ databaseId: "test-db", collectionId: "test-collection" })}
      >
        Submit
      </button>
    </div>
  ),
}));

jest.mock("immer", () => ({
  produce: jest.fn((updater) => (state: any) => {
    const draft = { ...state };
    updater(draft);
    return draft;
  }),
}));

const mockUseSidePanel = useSidePanel as jest.MockedFunction<typeof useSidePanel>;
const mockUseCopyJobContext = useCopyJobContext as jest.MockedFunction<typeof useCopyJobContext>;

describe("AddCollectionPanelWrapper", () => {
  const mockSetCopyJobState = jest.fn();
  const mockGoBack = jest.fn();
  const mockSetHeaderText = jest.fn();
  const mockExplorer = {} as Explorer;

  const mockSidePanelState = {
    isOpen: false,
    panelWidth: "440px",
    hasConsole: true,
    headerText: "",
    setHeaderText: mockSetHeaderText,
    openSidePanel: jest.fn(),
    closeSidePanel: jest.fn(),
    setPanelHasConsole: jest.fn(),
  };

  const mockCopyJobContextValue = {
    contextError: null,
    setContextError: jest.fn(),
    copyJobState: {
      jobName: "",
      migrationType: CopyJobMigrationType.Offline,
      source: {
        subscription: { subscriptionId: "" },
        account: null,
        databaseId: "",
        containerId: "",
      },
      target: {
        subscriptionId: "",
        account: null,
        databaseId: "",
        containerId: "",
      },
      sourceReadWriteAccessFromTarget: false,
    },
    setCopyJobState: mockSetCopyJobState,
    flow: null,
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: mockExplorer,
  } as unknown as CopyJobContextProviderType;

  const selectDestinationAccount = (accountName = "target-account", properties: DatabaseAccount["properties"] = {}) => {
    const account: DatabaseAccount = {
      id: `/subscriptions/target-sub/resourceGroups/target-rg/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
      name: accountName,
      location: "East US",
      type: "Microsoft.DocumentDB/databaseAccounts",
      kind: "GlobalDocumentDB",
      properties,
    };
    mockUseCopyJobContext.mockReturnValue({
      ...mockCopyJobContextValue,
      copyJobState: {
        ...mockCopyJobContextValue.copyJobState,
        target: { ...mockCopyJobContextValue.copyJobState.target, account },
      },
    });
    return account;
  };

  const getTargetAccountOverride = (): AccountOverride =>
    JSON.parse(screen.getByTestId("add-collection-panel").getAttribute("data-target-account"));

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readDatabasesWithARM).mockReset().mockResolvedValue([]);
    jest.mocked(armRequest).mockReset().mockResolvedValue({ properties: {} });

    mockUseSidePanel.mockReturnValue(mockSidePanelState);
    mockUseSidePanel.getState = jest.fn().mockReturnValue(mockSidePanelState);
    mockUseCopyJobContext.mockReturnValue(mockCopyJobContextValue);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render correctly with all required elements", () => {
      const { container } = render(<AddCollectionPanelWrapper />);

      expect(container.querySelector(".addCollectionPanelWrapper")).toBeInTheDocument();
      expect(container.querySelector(".addCollectionPanelHeader")).toBeInTheDocument();
      expect(container.querySelector(".addCollectionPanelBody")).toBeInTheDocument();
      expect(
        screen.getByText(t(Keys.containerCopy.selectContainers.createNewContainerSubHeadingDefault)),
      ).toBeInTheDocument();
      expect(screen.getByTestId("add-collection-panel")).toBeInTheDocument();
    });

    it("should match snapshot", () => {
      const { container } = render(<AddCollectionPanelWrapper />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with explorer prop", () => {
      const { container } = render(<AddCollectionPanelWrapper explorer={mockExplorer} />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with goBack prop", () => {
      const { container } = render(<AddCollectionPanelWrapper goBack={mockGoBack} />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with both props", () => {
      const { container } = render(<AddCollectionPanelWrapper explorer={mockExplorer} goBack={mockGoBack} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Side Panel Header Management", () => {
    it("should set header text to create container heading on mount", () => {
      render(<AddCollectionPanelWrapper />);

      expect(mockSetHeaderText).toHaveBeenCalledWith(t(Keys.containerCopy.selectContainers.createContainerHeading));
    });

    it("should reset header text to create copy job panel title on unmount", () => {
      const { unmount } = render(<AddCollectionPanelWrapper />);

      unmount();

      expect(mockSetHeaderText).toHaveBeenCalledWith(t(Keys.containerCopy.createCopyJob.panelTitle));
    });

    it("should not change header text if already set correctly", () => {
      const modifiedSidePanelState = {
        ...mockSidePanelState,
        headerText: t(Keys.containerCopy.selectContainers.createContainerHeading),
      };

      mockUseSidePanel.getState = jest.fn().mockReturnValue(modifiedSidePanelState);

      render(<AddCollectionPanelWrapper />);

      expect(mockSetHeaderText).not.toHaveBeenCalled();
    });
  });

  describe("AddCollectionPanel Integration", () => {
    it.each([true, false, undefined])(
      "uses the ARM embedding flag %s when Resource Graph omits it",
      async (enableEmbeddingGenerator) => {
        const account = selectDestinationAccount("target-account", {
          capabilities: [{ name: "EnableNoSQLVectorSearch", description: "" }],
          enableFreeTier: true,
          enableAnalyticalStorage: true,
        });
        jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator } });
        render(<AddCollectionPanelWrapper />);
        await screen.findByTestId("add-collection-panel");

        expect(armRequest).toHaveBeenCalledWith({
          host: configContext.ARM_ENDPOINT,
          path: account.id,
          method: "GET",
          apiVersion: "2026-04-01-preview",
        });
        expect(getTargetAccountOverride()).toEqual(
          expect.objectContaining({
            subscriptionId: "target-sub",
            resourceGroup: "target-rg",
            accountName: "target-account",
            ...account.properties,
            enableEmbeddingGenerator: enableEmbeddingGenerator ?? false,
          }),
        );
      },
    );

    it("fetches destination metadata through the ARM client with the embedding-capable API version", async () => {
      const account = selectDestinationAccount();
      const originalFetch = window.fetch;
      const originalToken = userContext.authorizationToken;
      window.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ properties: { enableEmbeddingGenerator: true } }),
      });
      updateUserContext({ authorizationToken: "test-token" });
      jest
        .mocked(armRequest)
        .mockImplementation(jest.requireActual<typeof import("Utils/arm/request")>("Utils/arm/request").armRequest);
      try {
        render(<AddCollectionPanelWrapper />);
        await screen.findByTestId("add-collection-panel");
        const url = new URL(account.id, configContext.ARM_ENDPOINT);
        url.searchParams.set("api-version", "2026-04-01-preview");
        expect(window.fetch).toHaveBeenCalledWith(
          url.href,
          expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: "test-token" }) }),
        );
        expect(getTargetAccountOverride().enableEmbeddingGenerator).toBe(true);
      } finally {
        window.fetch = originalFetch;
        updateUserContext({ authorizationToken: originalToken });
      }
    });

    it("refreshes the same destination instead of trusting a stale Resource Graph flag", async () => {
      selectDestinationAccount("target-account", { enableEmbeddingGenerator: true });
      jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator: false } });
      const view = render(<AddCollectionPanelWrapper />);
      await screen.findByTestId("add-collection-panel");
      expect(getTargetAccountOverride().enableEmbeddingGenerator).toBe(false);

      selectDestinationAccount("target-account", { enableEmbeddingGenerator: false });
      jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator: true } });
      view.rerender(<AddCollectionPanelWrapper />);
      await screen.findByTestId("add-collection-panel");
      expect(getTargetAccountOverride().enableEmbeddingGenerator).toBe(true);
    });

    it("waits for destination metadata before displaying the creation form", async () => {
      selectDestinationAccount();
      let resolveAccount: (account: Partial<DatabaseAccount>) => void;
      jest.mocked(armRequest).mockReturnValue(
        new Promise((resolve) => {
          resolveAccount = resolve;
        }),
      );
      render(<AddCollectionPanelWrapper />);
      await waitFor(() => expect(readDatabasesWithARM).toHaveBeenCalled());
      expect(screen.queryByTestId("add-collection-panel")).not.toBeInTheDocument();

      await act(async () => resolveAccount({ properties: { enableEmbeddingGenerator: true } }));
      expect(getTargetAccountOverride().enableEmbeddingGenerator).toBe(true);
    });

    it.each(["success", "failure"])("ignores a late %s from the previous destination", async (outcome) => {
      selectDestinationAccount("first-account");
      let resolveFirst: (account: Partial<DatabaseAccount>) => void;
      let rejectFirst: (error: Error) => void;
      jest.mocked(armRequest).mockReturnValueOnce(
        new Promise((resolve, reject) => {
          resolveFirst = resolve;
          rejectFirst = reject;
        }),
      );
      const view = render(<AddCollectionPanelWrapper />);

      selectDestinationAccount("second-account");
      jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator: true } });
      view.rerender(<AddCollectionPanelWrapper />);
      await screen.findByTestId("add-collection-panel");
      await act(async () => {
        if (outcome === "success") {
          resolveFirst({ properties: { enableEmbeddingGenerator: false } });
        } else {
          rejectFirst(new Error("Previous account lookup failed"));
        }
      });

      expect(getTargetAccountOverride()).toEqual(
        expect.objectContaining({ accountName: "second-account", enableEmbeddingGenerator: true }),
      );
      expect(screen.queryByText(t("containerCopy.selectContainers.embeddingStatusLoadFailed"))).not.toBeInTheDocument();
    });

    it("does not display the previous destination's flag while the next account loads", async () => {
      selectDestinationAccount("first-account");
      jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator: true } });
      const view = render(<AddCollectionPanelWrapper />);
      await screen.findByTestId("add-collection-panel");

      selectDestinationAccount("second-account");
      let resolveSecond: (account: Partial<DatabaseAccount>) => void;
      jest.mocked(armRequest).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
      view.rerender(<AddCollectionPanelWrapper />);
      expect(screen.queryByTestId("add-collection-panel")).not.toBeInTheDocument();

      await act(async () => resolveSecond({ properties: { enableEmbeddingGenerator: false } }));
      expect(getTargetAccountOverride()).toEqual(
        expect.objectContaining({ accountName: "second-account", enableEmbeddingGenerator: false }),
      );
    });

    it("preserves ordinary creation and warns when the embedding lookup fails", async () => {
      selectDestinationAccount("target-account", { enableEmbeddingGenerator: true });
      jest.mocked(armRequest).mockRejectedValue(new Error("Unsupported API version"));
      render(<AddCollectionPanelWrapper />);
      await screen.findByTestId("add-collection-panel");

      expect(getTargetAccountOverride().enableEmbeddingGenerator).toBe(false);
      expect(
        await screen.findByText(t("containerCopy.selectContainers.embeddingStatusLoadFailed")),
      ).toBeInTheDocument();
      screen.getByTestId("submit-button").click();
      expect(mockSetCopyJobState).toHaveBeenCalledTimes(1);
    });

    it("preserves database permission errors even if embedding metadata loads", async () => {
      selectDestinationAccount();
      jest.mocked(armRequest).mockResolvedValue({ properties: { enableEmbeddingGenerator: true } });
      jest.mocked(readDatabasesWithARM).mockRejectedValue(new Error("AuthorizationFailed"));
      render(<AddCollectionPanelWrapper />);

      expect(await screen.findByText(/You do not have sufficient permissions/)).toBeInTheDocument();
      expect(screen.queryByTestId("add-collection-panel")).not.toBeInTheDocument();
    });

    it("should pass explorer prop to AddCollectionPanel", () => {
      render(<AddCollectionPanelWrapper explorer={mockExplorer} />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("explorer-present");
    });

    it("should pass undefined explorer to AddCollectionPanel when not provided", () => {
      render(<AddCollectionPanelWrapper />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("no-explorer");
    });

    it("should pass isCopyJobFlow as true to AddCollectionPanel", () => {
      render(<AddCollectionPanelWrapper />);

      expect(screen.getByTestId("copy-job-flow")).toHaveTextContent("true");
    });
  });

  describe("Collection Success Handler", () => {
    it("should update copy job state when handleAddCollectionSuccess is called", async () => {
      render(<AddCollectionPanelWrapper goBack={mockGoBack} />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledTimes(1);
      });

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockState = {
        target: { databaseId: "", containerId: "" },
      };

      const updatedState = stateUpdater(mockState);
      expect(updatedState.target.databaseId).toBe("test-db");
      expect(updatedState.target.containerId).toBe("test-collection");
    });

    it("should call goBack when handleAddCollectionSuccess is called and goBack is provided", async () => {
      render(<AddCollectionPanelWrapper goBack={mockGoBack} />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call goBack when handleAddCollectionSuccess is called and goBack is not provided", async () => {
      render(<AddCollectionPanelWrapper />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledTimes(1);
      });

      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing setCopyJobState gracefully", () => {
      const mockCopyJobContextValueWithoutSetState = {
        ...mockCopyJobContextValue,
        setCopyJobState: undefined as any,
      };

      mockUseCopyJobContext.mockReturnValue(mockCopyJobContextValueWithoutSetState);

      expect(() => render(<AddCollectionPanelWrapper />)).not.toThrow();
    });
  });

  describe("Component Lifecycle", () => {
    it("should properly cleanup on unmount", () => {
      const { unmount } = render(<AddCollectionPanelWrapper />);
      expect(mockSetHeaderText).toHaveBeenCalledWith(t(Keys.containerCopy.selectContainers.createContainerHeading));
      mockSetHeaderText.mockClear();
      unmount();
      expect(mockSetHeaderText).toHaveBeenCalledWith(t(Keys.containerCopy.createCopyJob.panelTitle));
    });

    it("should re-render correctly when props change", () => {
      const { rerender } = render(<AddCollectionPanelWrapper />);
      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("no-explorer");
      rerender(<AddCollectionPanelWrapper explorer={mockExplorer} />);
      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("explorer-present");
    });
  });
});
