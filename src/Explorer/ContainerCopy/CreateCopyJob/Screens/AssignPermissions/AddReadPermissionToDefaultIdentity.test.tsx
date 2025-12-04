import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobContextProviderType } from "../../../Types/CopyJobTypes";
import AddReadPermissionToDefaultIdentity from "./AddReadPermissionToDefaultIdentity";

jest.mock("../../../../../Common/Logger", () => ({
  logError: jest.fn(),
}));

jest.mock("../../../../../Utils/arm/RbacUtils", () => ({
  assignRole: jest.fn(),
}));

jest.mock("../../../CopyJobUtils", () => ({
  getAccountDetailsFromResourceId: jest.fn(),
}));

jest.mock("../Components/InfoTooltip", () => {
  return function MockInfoTooltip({ content }: { content: React.ReactNode }) {
    return <div data-testid="info-tooltip">{content}</div>;
  };
});

jest.mock("../Components/PopoverContainer", () => {
  return function MockPopoverMessage({
    isLoading,
    visible,
    title,
    onCancel,
    onPrimary,
    children,
  }: {
    isLoading?: boolean;
    visible: boolean;
    title: string;
    onCancel: () => void;
    onPrimary: () => void;
    children: React.ReactNode;
  }) {
    if (!visible) return null;
    return (
      <div data-testid="popover-message" data-loading={isLoading}>
        <div data-testid="popover-title">{title}</div>
        <div data-testid="popover-content">{children}</div>
        <button onClick={onCancel} data-testid="popover-cancel">
          Cancel
        </button>
        <button onClick={onPrimary} data-testid="popover-primary">
          Primary
        </button>
      </div>
    );
  };
});

jest.mock("./hooks/useToggle", () => {
  return jest.fn();
});

// Import mocked modules
import { Subscription } from "Contracts/DataModels";
import { CopyJobMigrationType } from "Explorer/ContainerCopy/Enums/CopyJobEnums";
import { logError } from "../../../../../Common/Logger";
import { assignRole, RoleAssignmentType } from "../../../../../Utils/arm/RbacUtils";
import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";
import useToggle from "./hooks/useToggle";

describe("AddReadPermissionToDefaultIdentity Component", () => {
  const mockUseToggle = useToggle as jest.MockedFunction<typeof useToggle>;
  const mockAssignRole = assignRole as jest.MockedFunction<typeof assignRole>;
  const mockGetAccountDetailsFromResourceId = getAccountDetailsFromResourceId as jest.MockedFunction<
    typeof getAccountDetailsFromResourceId
  >;
  const mockLogError = logError as jest.MockedFunction<typeof logError>;

  const mockContextValue: CopyJobContextProviderType = {
    copyJobState: {
      jobName: "test-job",
      migrationType: CopyJobMigrationType.Offline,
      source: {
        subscription: { subscriptionId: "source-sub-id" } as Subscription,
        account: {
          id: "/subscriptions/source-sub-id/resourceGroups/source-rg/providers/Microsoft.DocumentDB/databaseAccounts/source-account",
          name: "source-account",
          location: "East US",
          kind: "GlobalDocumentDB",
          type: "Microsoft.DocumentDB/databaseAccounts",
          properties: {
            documentEndpoint: "https://source-account.documents.azure.com:443/",
          },
        },
        databaseId: "source-db",
        containerId: "source-container",
      },
      target: {
        subscriptionId: "target-sub-id",
        account: {
          id: "/subscriptions/target-sub-id/resourceGroups/target-rg/providers/Microsoft.DocumentDB/databaseAccounts/target-account",
          name: "target-account",
          location: "West US",
          kind: "GlobalDocumentDB",
          type: "Microsoft.DocumentDB/databaseAccounts",
          properties: {
            documentEndpoint: "https://target-account.documents.azure.com:443/",
          },
          identity: {
            principalId: "target-principal-id",
            type: "SystemAssigned",
          },
        },
        databaseId: "target-db",
        containerId: "target-container",
      },
      sourceReadAccessFromTarget: false,
    },
    setCopyJobState: jest.fn(),
    setContextError: jest.fn(),
    contextError: null,
    flow: null,
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: {} as any,
  };

  const renderComponent = (contextValue = mockContextValue) => {
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <AddReadPermissionToDefaultIdentity />
      </CopyJobContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToggle.mockReturnValue([false, jest.fn()]);
  });

  describe("Rendering", () => {
    it("should render correctly with default state", () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it("should render correctly when toggle is on", () => {
      mockUseToggle.mockReturnValue([true, jest.fn()]);
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it("should render correctly with different context states", () => {
      const contextWithError = {
        ...mockContextValue,
        contextError: "Test error message",
      };
      const { container } = renderComponent(contextWithError);
      expect(container).toMatchSnapshot();
    });

    it("should render correctly when sourceReadAccessFromTarget is true", () => {
      const contextWithAccess = {
        ...mockContextValue,
        copyJobState: {
          ...mockContextValue.copyJobState,
          sourceReadAccessFromTarget: true,
        },
      };
      const { container } = renderComponent(contextWithAccess);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Component Structure", () => {
    it("should display the description text", () => {
      renderComponent();
      expect(screen.getByText(ContainerCopyMessages.readPermissionAssigned.description)).toBeInTheDocument();
    });

    it("should display the info tooltip", () => {
      renderComponent();
      expect(screen.getByTestId("info-tooltip")).toBeInTheDocument();
    });

    it("should display the toggle component", () => {
      renderComponent();
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });

  describe("Toggle Interaction", () => {
    it("should call onToggle when toggle is clicked", () => {
      const mockOnToggle = jest.fn();
      mockUseToggle.mockReturnValue([false, mockOnToggle]);

      renderComponent();
      const toggle = screen.getByRole("switch");

      fireEvent.click(toggle);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("should show popover when toggle is turned on", () => {
      mockUseToggle.mockReturnValue([true, jest.fn()]);
      renderComponent();

      expect(screen.getByTestId("popover-message")).toBeInTheDocument();
      expect(screen.getByTestId("popover-title")).toHaveTextContent(
        ContainerCopyMessages.readPermissionAssigned.popoverTitle,
      );
      expect(screen.getByTestId("popover-content")).toHaveTextContent(
        ContainerCopyMessages.readPermissionAssigned.popoverDescription,
      );
    });

    it("should not show popover when toggle is turned off", () => {
      mockUseToggle.mockReturnValue([false, jest.fn()]);
      renderComponent();

      expect(screen.queryByTestId("popover-message")).not.toBeInTheDocument();
    });
  });

  describe("Popover Interactions", () => {
    beforeEach(() => {
      mockUseToggle.mockReturnValue([true, jest.fn()]);
    });

    it("should call onToggle with false when cancel button is clicked", () => {
      const mockOnToggle = jest.fn();
      mockUseToggle.mockReturnValue([true, mockOnToggle]);

      renderComponent();
      const cancelButton = screen.getByTestId("popover-cancel");

      fireEvent.click(cancelButton);
      expect(mockOnToggle).toHaveBeenCalledWith(null, false);
    });

    it("should call handleAddReadPermission when primary button is clicked", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockResolvedValue({ id: "role-assignment-id" } as RoleAssignmentType);

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalledWith(
          "/subscriptions/source-sub-id/resourceGroups/source-rg/providers/Microsoft.DocumentDB/databaseAccounts/source-account",
        );
      });
    });
  });

  describe("handleAddReadPermission Function", () => {
    beforeEach(() => {
      mockUseToggle.mockReturnValue([true, jest.fn()]);
    });

    it("should successfully assign role and update context", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockResolvedValue({ id: "role-assignment-id" } as RoleAssignmentType);

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalledWith(
          "source-sub-id",
          "source-rg",
          "source-account",
          "target-principal-id",
        );
      });

      await waitFor(() => {
        expect(mockContextValue.setCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it("should handle error when assignRole fails", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockRejectedValue(new Error("Permission denied"));

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalledWith(
          "Permission denied",
          "CopyJob/AddReadPermissionToDefaultIdentity.handleAddReadPermission",
        );
      });

      await waitFor(() => {
        expect(mockContextValue.setContextError).toHaveBeenCalledWith("Permission denied");
      });
    });

    it("should handle error without message", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockRejectedValue({});

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalledWith(
          "Error assigning read permission to default identity. Please try again later.",
          "CopyJob/AddReadPermissionToDefaultIdentity.handleAddReadPermission",
        );
      });

      await waitFor(() => {
        expect(mockContextValue.setContextError).toHaveBeenCalledWith(
          "Error assigning read permission to default identity. Please try again later.",
        );
      });
    });

    it("should show loading state during role assignment", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });

      // Mock a delayed response
      mockAssignRole.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: "role-id" } as RoleAssignmentType), 100)),
      );

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByTestId("popover-message")).toHaveAttribute("data-loading", "true");
      });
    });

    it.skip("should not assign role when assignRole returns falsy", async () => {
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockResolvedValue(null);

      renderComponent();
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalled();
      });

      // Should not update copyJobState when assignRole returns null
      expect(mockContextValue.setCopyJobState).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing target account identity", () => {
      const contextWithoutIdentity = {
        ...mockContextValue,
        copyJobState: {
          ...mockContextValue.copyJobState,
          target: {
            ...mockContextValue.copyJobState.target,
            account: {
              ...mockContextValue.copyJobState.target.account!,
              identity: undefined as any,
            },
          },
        },
      };

      const { container } = renderComponent(contextWithoutIdentity);
      expect(container).toMatchSnapshot();
    });

    it("should handle missing source account", () => {
      const contextWithoutSource = {
        ...mockContextValue,
        copyJobState: {
          ...mockContextValue.copyJobState,
          source: {
            ...mockContextValue.copyJobState.source,
            account: null as any,
          },
        },
      };

      const { container } = renderComponent(contextWithoutSource);
      expect(container).toMatchSnapshot();
    });

    it("should handle empty string principal ID", async () => {
      const contextWithEmptyPrincipal = {
        ...mockContextValue,
        copyJobState: {
          ...mockContextValue.copyJobState,
          target: {
            ...mockContextValue.copyJobState.target,
            account: {
              ...mockContextValue.copyJobState.target.account!,
              identity: {
                principalId: "",
                type: "SystemAssigned",
              },
            },
          },
        },
      };

      mockUseToggle.mockReturnValue([true, jest.fn()]);
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockResolvedValue({ id: "role-assignment-id" } as RoleAssignmentType);

      renderComponent(contextWithEmptyPrincipal);
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalledWith("source-sub-id", "source-rg", "source-account", "");
      });
    });
  });

  describe("Component Integration", () => {
    it("should work with all context updates", async () => {
      const setCopyJobStateMock = jest.fn();
      const setContextErrorMock = jest.fn();

      const fullContextValue = {
        ...mockContextValue,
        setCopyJobState: setCopyJobStateMock,
        setContextError: setContextErrorMock,
      };

      mockUseToggle.mockReturnValue([true, jest.fn()]);
      mockGetAccountDetailsFromResourceId.mockReturnValue({
        subscriptionId: "source-sub-id",
        resourceGroup: "source-rg",
        accountName: "source-account",
      });
      mockAssignRole.mockResolvedValue({ id: "role-assignment-id" } as RoleAssignmentType);

      renderComponent(fullContextValue);
      const primaryButton = screen.getByTestId("popover-primary");

      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(setCopyJobStateMock).toHaveBeenCalledWith(expect.any(Function));
      });

      // Test the function passed to setCopyJobState
      const setCopyJobStateCall = setCopyJobStateMock.mock.calls[0][0];
      const updatedState = setCopyJobStateCall(mockContextValue.copyJobState);

      expect(updatedState).toEqual({
        ...mockContextValue.copyJobState,
        sourceReadAccessFromTarget: true,
      });
    });
  });
});
