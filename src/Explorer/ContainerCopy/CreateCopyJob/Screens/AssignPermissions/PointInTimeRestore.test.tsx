import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { logError } from "Common/Logger";
import { DatabaseAccount } from "Contracts/DataModels";
import React from "react";
import { fetchDatabaseAccount } from "Utils/arm/databaseAccountUtils";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState } from "../../../Types/CopyJobTypes";
import PointInTimeRestore from "./PointInTimeRestore";

jest.mock("Utils/arm/databaseAccountUtils");
jest.mock("Common/Logger");

const mockFetchDatabaseAccount = fetchDatabaseAccount as jest.MockedFunction<typeof fetchDatabaseAccount>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

const mockWindowOpen = jest.fn();
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true,
});

global.clearInterval = jest.fn();
global.clearTimeout = jest.fn();

describe("PointInTimeRestore", () => {
  const mockSourceAccount: DatabaseAccount = {
    id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
    name: "test-account",
    type: "Microsoft.DocumentDB/databaseAccounts",
    location: "East US",
    properties: {
      backupPolicy: {
        type: "Continuous",
      },
    },
  } as DatabaseAccount;

  const mockUpdatedAccount: DatabaseAccount = {
    ...mockSourceAccount,
    properties: {
      backupPolicy: {
        type: "Periodic",
      },
    },
  } as DatabaseAccount;

  const defaultCopyJobState = {
    jobName: "test-job",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: { subscriptionId: "test-sub", displayName: "Test Subscription" },
      account: mockSourceAccount,
      databaseId: "test-db",
      containerId: "test-container",
    },
    target: {
      subscriptionId: "test-sub",
      account: mockSourceAccount,
      databaseId: "target-db",
      containerId: "target-container",
    },
    sourceReadAccessFromTarget: false,
  } as CopyJobContextState;

  const mockSetCopyJobState = jest.fn();

  const createMockContext = (overrides?: Partial<CopyJobContextProviderType>): CopyJobContextProviderType => ({
    copyJobState: defaultCopyJobState,
    setCopyJobState: mockSetCopyJobState,
    flow: null,
    setFlow: jest.fn(),
    contextError: null,
    setContextError: jest.fn(),
    resetCopyJobState: jest.fn(),
    ...overrides,
  });

  const renderWithContext = (contextValue: CopyJobContextProviderType) => {
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <PointInTimeRestore />
      </CopyJobContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchDatabaseAccount.mockClear();
    mockLogError.mockClear();
    mockWindowOpen.mockClear();
    mockSetCopyJobState.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Initial Render", () => {
    it("should render correctly with default props", () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      expect(container).toMatchSnapshot();
    });

    it("should display the correct description with account name", () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      expect(screen.getByText(/test-account/)).toBeInTheDocument();
    });

    it("should show the primary action button with correct text", () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("should render with empty account name gracefully", () => {
      const contextWithoutAccount = createMockContext({
        copyJobState: {
          ...defaultCopyJobState,
          source: {
            ...defaultCopyJobState.source,
            account: { ...mockSourceAccount, name: "" },
          },
        },
      });

      const { container } = renderWithContext(contextWithoutAccount);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Button Interactions", () => {
    it("should open window and start monitoring when button is clicked", () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringMatching(
          /#resource\/subscriptions\/test-sub\/resourceGroups\/test-rg\/providers\/Microsoft.DocumentDB\/databaseAccounts\/test-account\/backupRestore$/,
        ),
        "_blank",
      );
    });

    it("should disable button and show loading state after click", () => {
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(screen.getByText(/Please wait while we process your request/)).toBeInTheDocument();
    });

    it("should show refresh button when timeout occurs", async () => {
      jest.useFakeTimers();
      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await waitFor(() => {
        expect(screen.getByText(/Refresh/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it("should fetch account periodically after button click", async () => {
      jest.useFakeTimers();
      mockFetchDatabaseAccount.mockResolvedValue(mockUpdatedAccount);

      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(30 * 1000);

      await waitFor(() => {
        expect(mockFetchDatabaseAccount).toHaveBeenCalledWith("test-sub", "test-rg", "test-account");
      });

      jest.useRealTimers();
    });

    it("should not update context when account validation fails", async () => {
      jest.useFakeTimers();
      mockFetchDatabaseAccount.mockResolvedValue(mockSourceAccount);

      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(30 * 1000);

      await waitFor(() => {
        expect(mockFetchDatabaseAccount).toHaveBeenCalled();
      });

      expect(mockSetCopyJobState).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe("Refresh Button Functionality", () => {
    it("should handle refresh button click", async () => {
      jest.useFakeTimers();
      mockFetchDatabaseAccount.mockResolvedValue(mockUpdatedAccount);

      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await waitFor(() => {
        const refreshButton = screen.getByText(/Refresh/);
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByText(/Refresh/);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetchDatabaseAccount).toHaveBeenCalledWith("test-sub", "test-rg", "test-account");
      });

      jest.useRealTimers();
    });

    it("should show loading state during refresh", async () => {
      jest.useFakeTimers();
      mockFetchDatabaseAccount.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUpdatedAccount), 1000)),
      );

      const mockContext = createMockContext();
      renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await waitFor(() => {
        expect(screen.getByText(/Refresh/)).toBeInTheDocument();
      });

      const refreshButton = screen.getByText(/Refresh/);
      fireEvent.click(refreshButton);

      expect(screen.getByText(/Please wait while we process your request/)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing source account gracefully", () => {
      const contextWithoutSourceAccount = createMockContext({
        copyJobState: {
          ...defaultCopyJobState,
          source: {
            ...defaultCopyJobState.source,
            account: null as any,
          },
        },
      });

      const { container } = renderWithContext(contextWithoutSourceAccount);
      expect(container).toMatchSnapshot();
    });

    it("should handle missing account ID gracefully", () => {
      const contextWithoutAccountId = createMockContext({
        copyJobState: {
          ...defaultCopyJobState,
          source: {
            ...defaultCopyJobState.source,
            account: { ...mockSourceAccount, id: undefined as any },
          },
        },
      });

      const { container } = renderWithContext(contextWithoutAccountId);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Snapshots", () => {
    it("should match snapshot in loading state", () => {
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with refresh button", async () => {
      jest.useFakeTimers();
      const mockContext = createMockContext();
      const { container } = renderWithContext(mockContext);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await waitFor(() => {
        expect(screen.getByText(/Refresh/)).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
      jest.useRealTimers();
    });
  });
});
