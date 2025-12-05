import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DatabaseAccount } from "Contracts/DataModels";
import { CopyJobContextProviderType } from "Explorer/ContainerCopy/Types/CopyJobTypes";
import React from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import { CapabilityNames } from "../../../../../Common/Constants";
import { logError } from "../../../../../Common/Logger";
import { update as updateDatabaseAccount } from "../../../../../Utils/arm/generatedClients/cosmos/databaseAccounts";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import OnlineCopyEnabled from "./OnlineCopyEnabled";

jest.mock("Utils/arm/databaseAccountUtils", () => ({
  fetchDatabaseAccount: jest.fn(),
}));

jest.mock("../../../../../Utils/arm/generatedClients/cosmos/databaseAccounts", () => ({
  update: jest.fn(),
}));

jest.mock("../../../../../Common/Logger", () => ({
  logError: jest.fn(),
}));

jest.mock("../../../../../Common/LoadingOverlay", () => {
  return function MockLoadingOverlay({ isLoading, label }: { isLoading: boolean; label: string }) {
    return isLoading ? <div data-testid="loading-overlay">{label}</div> : null;
  };
});

const mockFetchDatabaseAccount = fetchDatabaseAccount as jest.MockedFunction<typeof fetchDatabaseAccount>;
const mockUpdateDatabaseAccount = updateDatabaseAccount as jest.MockedFunction<typeof updateDatabaseAccount>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe("OnlineCopyEnabled", () => {
  const mockSetContextError = jest.fn();
  const mockSetCopyJobState = jest.fn();

  const mockSourceAccount: DatabaseAccount = {
    id: "/subscriptions/test-sub-id/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
    name: "test-account",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      capabilities: [],
      enableAllVersionsAndDeletesChangeFeed: false,
      locations: [],
      writeLocations: [],
      readLocations: [],
    },
  };

  const mockCopyJobContextValue = {
    copyJobState: {
      source: {
        account: mockSourceAccount,
      },
    },
    setCopyJobState: mockSetCopyJobState,
    setContextError: mockSetContextError,
    contextError: "",
    flow: { currentScreen: "" },
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: {} as any,
  } as unknown as CopyJobContextProviderType;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderComponent = (contextValue = mockCopyJobContextValue) => {
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <OnlineCopyEnabled />
      </CopyJobContext.Provider>,
    );
  };

  describe("Rendering", () => {
    it("should render correctly with initial state", () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it("should render the description with account name", () => {
      renderComponent();

      const description = screen.getByText(ContainerCopyMessages.onlineCopyEnabled.description("test-account"));
      expect(description).toBeInTheDocument();
    });

    it("should render the learn more link", () => {
      renderComponent();

      const link = screen.getByRole("link", {
        name: ContainerCopyMessages.onlineCopyEnabled.hrefText,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", ContainerCopyMessages.onlineCopyEnabled.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should render the enable button with correct text when not loading", () => {
      renderComponent();

      const button = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("should not show loading overlay initially", () => {
      renderComponent();

      const loadingOverlay = screen.queryByTestId("loading-overlay");
      expect(loadingOverlay).not.toBeInTheDocument();
    });

    it("should not show refresh button initially", () => {
      renderComponent();

      const refreshButton = screen.queryByRole("button", {
        name: ContainerCopyMessages.refreshButtonLabel,
      });
      expect(refreshButton).not.toBeInTheDocument();
    });
  });

  describe("Enable Online Copy Flow", () => {
    it("should handle complete enable online copy flow successfully", async () => {
      const accountAfterChangeFeedUpdate = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          enableAllVersionsAndDeletesChangeFeed: true,
        },
      };

      const accountWithOnlineCopyEnabled: DatabaseAccount = {
        ...accountAfterChangeFeedUpdate,
        properties: {
          ...accountAfterChangeFeedUpdate.properties,
          capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature, description: "Enables online copy feature" }],
        },
      };

      mockFetchDatabaseAccount
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(accountWithOnlineCopyEnabled);

      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
      await waitFor(() => {
        expect(mockFetchDatabaseAccount).toHaveBeenCalledWith("test-sub-id", "test-rg", "test-account");
      });

      await waitFor(() => {
        expect(mockUpdateDatabaseAccount).toHaveBeenCalledWith("test-sub-id", "test-rg", "test-account", {
          properties: {
            enableAllVersionsAndDeletesChangeFeed: true,
          },
        });
      });

      await waitFor(() => {
        expect(mockUpdateDatabaseAccount).toHaveBeenCalledWith("test-sub-id", "test-rg", "test-account", {
          properties: {
            capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature }],
          },
        });
      });
    });

    it("should skip change feed enablement if already enabled", async () => {
      const accountWithChangeFeedEnabled = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          enableAllVersionsAndDeletesChangeFeed: true,
        },
      };

      const accountWithOnlineCopyEnabled: DatabaseAccount = {
        ...accountWithChangeFeedEnabled,
        properties: {
          ...accountWithChangeFeedEnabled.properties,
          capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature, description: "Enables online copy feature" }],
        },
      };

      mockFetchDatabaseAccount
        .mockResolvedValueOnce(accountWithChangeFeedEnabled)
        .mockResolvedValueOnce(accountWithOnlineCopyEnabled);

      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await waitFor(() => {
        expect(mockUpdateDatabaseAccount).toHaveBeenCalledTimes(1);
        expect(mockUpdateDatabaseAccount).toHaveBeenCalledWith("test-sub-id", "test-rg", "test-account", {
          properties: {
            capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature }],
          },
        });
      });
    });

    it("should show correct loading messages during the process", async () => {
      mockFetchDatabaseAccount.mockResolvedValue(mockSourceAccount);
      mockUpdateDatabaseAccount.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await waitFor(() => {
        expect(mockFetchDatabaseAccount).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          screen.getByText(ContainerCopyMessages.onlineCopyEnabled.enablingOnlineCopySpinnerLabel("test-account")),
        ).toBeInTheDocument();
      });
    });

    it("should handle error during update operations", async () => {
      const errorMessage = "Failed to update account";
      mockFetchDatabaseAccount.mockResolvedValue(mockSourceAccount);
      mockUpdateDatabaseAccount.mockRejectedValue(new Error(errorMessage));

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalledWith(errorMessage, "CopyJob/OnlineCopyEnabled.handleOnlineCopyEnable");
        expect(mockSetContextError).toHaveBeenCalledWith(errorMessage);
      });

      expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
    });

    it("should handle refresh button click", async () => {
      const accountWithOnlineCopyEnabled: DatabaseAccount = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature, description: "Enables online copy feature" }],
        },
      };

      mockFetchDatabaseAccount
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(accountWithOnlineCopyEnabled);

      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      const refreshButton = screen.getByRole("button", {
        name: ContainerCopyMessages.refreshButtonLabel,
      });

      await act(async () => {
        fireEvent.click(refreshButton);
      });

      expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalled();
      });
    });
  });

  describe("Account Validation and State Updates", () => {
    it("should update state when account capabilities change", async () => {
      const accountWithOnlineCopyEnabled: DatabaseAccount = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature, description: "Enables online copy feature" }],
        },
      };

      mockFetchDatabaseAccount.mockResolvedValue(accountWithOnlineCopyEnabled);
      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });

      const stateUpdateFunction = mockSetCopyJobState.mock.calls[0][0];
      const newState = stateUpdateFunction({
        source: { account: mockSourceAccount },
      });

      expect(newState.source.account).toEqual(accountWithOnlineCopyEnabled);
    });

    it("should not update state when account capabilities remain unchanged", async () => {
      mockFetchDatabaseAccount.mockResolvedValue(mockSourceAccount);
      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockSetCopyJobState).not.toHaveBeenCalled();
    });
  });

  describe("Button States and Interactions", () => {
    it("should disable button during loading", async () => {
      mockFetchDatabaseAccount.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      const loadingButton = screen.getByRole("button");
      expect(loadingButton).toBeDisabled();
    });

    it("should show sync icon during loading", async () => {
      mockFetchDatabaseAccount.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      const loadingButton = screen.getByRole("button");
      expect(loadingButton.querySelector("[data-icon-name='SyncStatusSolid']")).toBeInTheDocument();
    });

    it("should disable refresh button during loading", async () => {
      mockFetchDatabaseAccount.mockResolvedValue(mockSourceAccount);
      mockUpdateDatabaseAccount.mockResolvedValue({} as any);

      renderComponent();

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });

      await act(async () => {
        fireEvent.click(enableButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      mockFetchDatabaseAccount.mockImplementation(() => new Promise(() => {}));

      const refreshButton = screen.getByRole("button", {
        name: ContainerCopyMessages.refreshButtonLabel,
      });

      await act(async () => {
        fireEvent.click(refreshButton);
      });

      expect(refreshButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing account name gracefully", () => {
      const contextWithoutAccountName = {
        ...mockCopyJobContextValue,
        copyJobState: {
          source: {
            account: {
              ...mockSourceAccount,
              name: "",
            },
          },
        },
      } as CopyJobContextProviderType;

      const { container } = renderComponent(contextWithoutAccountName);
      expect(container).toMatchSnapshot();
    });

    it("should handle null account", () => {
      const contextWithNullAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          source: {
            account: null as DatabaseAccount | null,
          },
        },
      } as CopyJobContextProviderType;

      const { container } = renderComponent(contextWithNullAccount);
      expect(container).toMatchSnapshot();
    });

    it("should handle account with existing online copy capability", () => {
      const accountWithExistingCapability = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          capabilities: [{ name: CapabilityNames.EnableOnlineCopyFeature }, { name: "SomeOtherCapability" }],
        },
      };

      const contextWithExistingCapability = {
        ...mockCopyJobContextValue,
        copyJobState: {
          source: {
            account: accountWithExistingCapability,
          },
        },
      } as CopyJobContextProviderType;

      const { container } = renderComponent(contextWithExistingCapability);
      expect(container).toMatchSnapshot();
    });

    it("should handle account with no capabilities array", () => {
      const accountWithNoCapabilities = {
        ...mockSourceAccount,
        properties: {
          ...mockSourceAccount.properties,
          capabilities: undefined,
        },
      } as DatabaseAccount;

      const contextWithNoCapabilities = {
        ...mockCopyJobContextValue,
        copyJobState: {
          source: {
            account: accountWithNoCapabilities,
          },
        },
      } as CopyJobContextProviderType;

      renderComponent(contextWithNoCapabilities);

      const enableButton = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });
      expect(enableButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button role and accessibility attributes", () => {
      renderComponent();

      const button = screen.getByRole("button", {
        name: ContainerCopyMessages.onlineCopyEnabled.buttonText,
      });
      expect(button).toBeInTheDocument();
    });

    it("should have proper link accessibility", () => {
      renderComponent();

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should apply correct CSS class to container", () => {
      const { container } = renderComponent();

      const onlineCopyContainer = container.querySelector(".onlineCopyContainer");
      expect(onlineCopyContainer).toBeInTheDocument();
    });

    it("should apply fullWidth class to buttons", () => {
      renderComponent();

      const button = screen.getByRole("button");
      expect(button).toHaveClass("fullWidth");
    });
  });
});
