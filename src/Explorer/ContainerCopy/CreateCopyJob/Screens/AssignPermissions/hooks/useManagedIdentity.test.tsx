import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { logError } from "../../../../../../Common/Logger";
import { DatabaseAccount } from "../../../../../../Contracts/DataModels";
import Explorer from "../../../../../Explorer";
import CopyJobContextProvider, { useCopyJobContext } from "../../../../Context/CopyJobContext";
import { getAccountDetailsFromResourceId } from "../../../../CopyJobUtils";
import useManagedIdentity from "./useManagedIdentity";

jest.mock("../../../../CopyJobUtils");
jest.mock("../../../../../../Common/Logger");

const mockGetAccountDetailsFromResourceId = getAccountDetailsFromResourceId as jest.MockedFunction<
  typeof getAccountDetailsFromResourceId
>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

const mockDatabaseAccount: DatabaseAccount = {
  id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
  name: "test-account",
  location: "East US",
  type: "Microsoft.DocumentDB/databaseAccounts",
  kind: "GlobalDocumentDB",
  properties: {
    documentEndpoint: "https://test-account.documents.azure.com:443/",
  },
} as DatabaseAccount;

interface TestComponentProps {
  updateIdentityFn: (
    subscriptionId: string,
    resourceGroup?: string,
    accountName?: string,
  ) => Promise<DatabaseAccount | undefined>;
  onError?: (error: string) => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ updateIdentityFn, onError }) => {
  const { loading, handleAddSystemIdentity } = useManagedIdentity(updateIdentityFn);
  const { contextError } = useCopyJobContext();

  React.useEffect(() => {
    if (contextError && onError) {
      onError(contextError);
    }
  }, [contextError, onError]);

  const handleClick = async () => {
    await handleAddSystemIdentity();
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading} data-test="add-identity-button">
        {loading ? "Loading..." : "Add System Identity"}
      </button>
      <div data-test="loading-status">{loading ? "true" : "false"}</div>
      {contextError && <div data-test="error-message">{contextError}</div>}
    </div>
  );
};

const TestWrapper: React.FC<TestComponentProps> = (props) => {
  const mockExplorer = new Explorer();

  return (
    <CopyJobContextProvider explorer={mockExplorer}>
      <TestComponent {...props} />
    </CopyJobContextProvider>
  );
};

describe("useManagedIdentity", () => {
  const mockUpdateIdentityFn = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountDetailsFromResourceId.mockReturnValue({
      subscriptionId: "test-subscription",
      resourceGroup: "test-resource-group",
      accountName: "test-account-name",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should initialize with loading false", () => {
    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    expect(screen.getByTestId("loading-status")).toHaveTextContent("false");
    expect(screen.getByTestId("add-identity-button")).toHaveTextContent("Add System Identity");
    expect(screen.getByTestId("add-identity-button")).not.toBeDisabled();
  });

  it("should show loading state when handleAddSystemIdentity is called", async () => {
    mockUpdateIdentityFn.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockDatabaseAccount), 100)),
    );

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    expect(screen.getByTestId("loading-status")).toHaveTextContent("true");
    expect(button).toHaveTextContent("Loading...");
    expect(button).toBeDisabled();
  });

  it("should call updateIdentityFn with correct parameters", async () => {
    mockUpdateIdentityFn.mockResolvedValue(mockDatabaseAccount);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateIdentityFn).toHaveBeenCalledWith(
        "test-subscription",
        "test-resource-group",
        "test-account-name",
      );
    });
  });

  it("should handle successful identity update", async () => {
    const updatedAccount = {
      ...mockDatabaseAccount,
      properties: {
        ...mockDatabaseAccount.properties,
        identity: { type: "SystemAssigned" },
      },
    };
    mockUpdateIdentityFn.mockResolvedValue(updatedAccount);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateIdentityFn).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("error-message")).toBeNull();
  });

  it("should handle error when updateIdentityFn fails", async () => {
    const errorMessage = "Failed to update identity";
    mockUpdateIdentityFn.mockRejectedValue(new Error(errorMessage));

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(errorMessage);
    });

    expect(mockLogError).toHaveBeenCalledWith(errorMessage, "CopyJob/useManagedIdentity.handleAddSystemIdentity");
    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it("should handle error without message", async () => {
    const errorWithoutMessage = {} as Error;
    mockUpdateIdentityFn.mockRejectedValue(errorWithoutMessage);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Error enabling system-assigned managed identity. Please try again later.",
      );
    });

    expect(mockLogError).toHaveBeenCalledWith(
      "Error enabling system-assigned managed identity. Please try again later.",
      "CopyJob/useManagedIdentity.handleAddSystemIdentity",
    );
  });

  it("should handle case when getAccountDetailsFromResourceId returns null", async () => {
    mockGetAccountDetailsFromResourceId.mockReturnValue(null);
    mockUpdateIdentityFn.mockResolvedValue(undefined);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateIdentityFn).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  it("should handle case when updateIdentityFn returns undefined", async () => {
    mockUpdateIdentityFn.mockResolvedValue(undefined);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateIdentityFn).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("error-message")).toBeNull();
  });

  it("should call getAccountDetailsFromResourceId with target account id", async () => {
    mockUpdateIdentityFn.mockResolvedValue(mockDatabaseAccount);

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalled();
    });

    const callArgs = mockGetAccountDetailsFromResourceId.mock.calls[0];
    expect(callArgs).toBeDefined();
  });

  it("should reset loading state on error", async () => {
    const errorMessage = "Network error";
    mockUpdateIdentityFn.mockRejectedValue(new Error(errorMessage));

    render(<TestWrapper updateIdentityFn={mockUpdateIdentityFn} onError={mockOnError} />);

    const button = screen.getByTestId("add-identity-button");
    fireEvent.click(button);

    expect(screen.getByTestId("loading-status")).toHaveTextContent("true");

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(errorMessage);
    });

    expect(screen.getByTestId("loading-status")).toHaveTextContent("false");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Add System Identity");
  });
});
