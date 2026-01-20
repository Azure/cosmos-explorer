import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { configContext, Platform } from "../../../../../../ConfigContext";
import { DatabaseAccount } from "../../../../../../Contracts/DataModels";
import * as useDatabaseAccountsHook from "../../../../../../hooks/useDatabaseAccounts";
import { apiType, userContext } from "../../../../../../UserContext";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState } from "../../../../Types/CopyJobTypes";
import { AccountDropdown, normalizeAccountId } from "./AccountDropdown";

jest.mock("../../../../../../hooks/useDatabaseAccounts");
jest.mock("../../../../../../UserContext", () => ({
  userContext: {
    databaseAccount: null as DatabaseAccount | null,
  },
  apiType: jest.fn(),
}));
jest.mock("../../../../../../ConfigContext", () => ({
  configContext: {
    platform: "Portal",
  },
  Platform: {
    Portal: "Portal",
    Hosted: "Hosted",
  },
}));

const mockUseDatabaseAccounts = useDatabaseAccountsHook.useDatabaseAccounts as jest.MockedFunction<
  typeof useDatabaseAccountsHook.useDatabaseAccounts
>;

describe("AccountDropdown", () => {
  const mockSetCopyJobState = jest.fn();
  const mockCopyJobState = {
    jobName: "",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: {
        subscriptionId: "test-subscription-id",
        displayName: "Test Subscription",
      },
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
    sourceReadAccessFromTarget: false,
  } as CopyJobContextState;

  const mockCopyJobContextValue = {
    copyJobState: mockCopyJobState,
    setCopyJobState: mockSetCopyJobState,
    flow: null,
    setFlow: jest.fn(),
    contextError: null,
    setContextError: jest.fn(),
    resetCopyJobState: jest.fn(),
  } as CopyJobContextProviderType;

  const mockDatabaseAccount1: DatabaseAccount = {
    id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDb/databaseAccounts/account1",
    name: "test-account-1",
    kind: "GlobalDocumentDB",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    tags: {},
    properties: {
      documentEndpoint: "https://account1.documents.azure.com:443/",
      capabilities: [],
      enableMultipleWriteLocations: false,
    },
  };

  const mockDatabaseAccount2: DatabaseAccount = {
    id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDb/databaseAccounts/account2",
    name: "test-account-2",
    kind: "GlobalDocumentDB",
    location: "West US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    tags: {},
    properties: {
      documentEndpoint: "https://account2.documents.azure.com:443/",
      capabilities: [],
      enableMultipleWriteLocations: false,
    },
  };

  const mockNonSqlAccount: DatabaseAccount = {
    id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDb/databaseAccounts/mongo-account",
    name: "mongo-account",
    kind: "MongoDB",
    location: "Central US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    tags: {},
    properties: {
      documentEndpoint: "https://mongo-account.documents.azure.com:443/",
      capabilities: [],
      enableMultipleWriteLocations: false,
    },
  };

  const renderWithContext = (contextValue = mockCopyJobContextValue) => {
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <AccountDropdown />
      </CopyJobContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiType as jest.MockedFunction<any>).mockImplementation((account: DatabaseAccount) => {
      return account.kind === "MongoDB" ? "MongoDB" : "SQL";
    });
  });

  describe("Rendering", () => {
    it("should render dropdown with correct label and placeholder", () => {
      mockUseDatabaseAccounts.mockReturnValue([]);

      renderWithContext();

      expect(
        screen.getByText(`${ContainerCopyMessages.sourceAccountDropdownLabel}:`, { exact: true }),
      ).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-label",
        ContainerCopyMessages.sourceAccountDropdownLabel,
      );
    });

    it("should render disabled dropdown when no subscription is selected", () => {
      mockUseDatabaseAccounts.mockReturnValue([]);
      const contextWithoutSubscription = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            subscription: null,
          },
        } as CopyJobContextState,
      };

      renderWithContext(contextWithoutSubscription);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("should render disabled dropdown when no accounts are available", () => {
      mockUseDatabaseAccounts.mockReturnValue([]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("should render enabled dropdown when accounts are available", () => {
      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-disabled", "false");
    });
  });

  describe("Account filtering", () => {
    it("should filter accounts to only show SQL API accounts", () => {
      const allAccounts = [mockDatabaseAccount1, mockDatabaseAccount2, mockNonSqlAccount];
      mockUseDatabaseAccounts.mockReturnValue(allAccounts);

      renderWithContext();

      expect(mockUseDatabaseAccounts).toHaveBeenCalledWith("test-subscription-id");

      expect(apiType as jest.MockedFunction<any>).toHaveBeenCalledWith(mockDatabaseAccount1);
      expect(apiType as jest.MockedFunction<any>).toHaveBeenCalledWith(mockDatabaseAccount2);
      expect(apiType as jest.MockedFunction<any>).toHaveBeenCalledWith(mockNonSqlAccount);
    });
  });

  describe("Account selection", () => {
    it("should auto-select the first SQL account when no account is currently selected", async () => {
      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });

      const stateUpdateFunction = mockSetCopyJobState.mock.calls[0][0];
      const newState = stateUpdateFunction(mockCopyJobState);
      expect(newState.source.account).toEqual({
        ...mockDatabaseAccount1,
        id: normalizeAccountId(mockDatabaseAccount1.id),
      });
    });

    it("should auto-select predefined account from userContext if available", async () => {
      const userContextAccount = {
        ...mockDatabaseAccount2,
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/account2",
      };

      (userContext as any).databaseAccount = userContextAccount;

      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });

      const stateUpdateFunction = mockSetCopyJobState.mock.calls[0][0];
      const newState = stateUpdateFunction(mockCopyJobState);
      expect(newState.source.account).toEqual({
        ...mockDatabaseAccount2,
        id: normalizeAccountId(mockDatabaseAccount2.id),
      });
    });

    it("should keep current account if it exists in the filtered list", async () => {
      const contextWithSelectedAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            account: mockDatabaseAccount1,
          },
        },
      };

      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext(contextWithSelectedAccount);

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });

      const stateUpdateFunction = mockSetCopyJobState.mock.calls[0][0];
      const newState = stateUpdateFunction(contextWithSelectedAccount.copyJobState);
      expect(newState).toEqual({
        ...contextWithSelectedAccount.copyJobState,
        source: {
          ...contextWithSelectedAccount.copyJobState.source,
          account: {
            ...mockDatabaseAccount1,
            id: normalizeAccountId(mockDatabaseAccount1.id),
          },
        },
      });
    });

    it("should handle account change when user selects different account", async () => {
      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("test-account-2");
        fireEvent.click(option);
      });

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("ID normalization", () => {
    it("should normalize account ID for Portal platform", () => {
      const portalAccount = {
        ...mockDatabaseAccount1,
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/account1",
      };

      (configContext as any).platform = Platform.Portal;
      mockUseDatabaseAccounts.mockReturnValue([portalAccount]);

      const contextWithSelectedAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            account: portalAccount,
          },
        },
      };

      renderWithContext(contextWithSelectedAccount);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toMatchSnapshot();
    });

    it("should normalize account ID for Hosted platform", () => {
      const hostedAccount = {
        ...mockDatabaseAccount1,
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/account1",
      };

      (configContext as any).platform = Platform.Hosted;
      mockUseDatabaseAccounts.mockReturnValue([hostedAccount]);

      const contextWithSelectedAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            account: hostedAccount,
          },
        },
      };

      renderWithContext(contextWithSelectedAccount);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty account list gracefully", () => {
      mockUseDatabaseAccounts.mockReturnValue([]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("should handle null account list gracefully", () => {
      mockUseDatabaseAccounts.mockReturnValue(null as any);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("should handle undefined subscription ID", () => {
      const contextWithoutSubscription = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            subscription: null,
          },
        } as CopyJobContextState,
      };

      mockUseDatabaseAccounts.mockReturnValue([]);

      renderWithContext(contextWithoutSubscription);

      expect(mockUseDatabaseAccounts).toHaveBeenCalledWith(undefined);
    });

    it("should not update state if account is already selected and the same", async () => {
      const selectedAccount = mockDatabaseAccount1;
      const contextWithSelectedAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          ...mockCopyJobState,
          source: {
            ...mockCopyJobState.source,
            account: selectedAccount,
          },
        },
      };

      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1, mockDatabaseAccount2]);

      renderWithContext(contextWithSelectedAccount);

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });

      const stateUpdateFunction = mockSetCopyJobState.mock.calls[0][0];
      const newState = stateUpdateFunction(contextWithSelectedAccount.copyJobState);
      expect(newState).toBe(contextWithSelectedAccount.copyJobState);
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label", () => {
      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-label", ContainerCopyMessages.sourceAccountDropdownLabel);
    });

    it("should have required attribute", () => {
      mockUseDatabaseAccounts.mockReturnValue([mockDatabaseAccount1]);

      renderWithContext();

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toHaveAttribute("aria-required", "true");
    });
  });
});
