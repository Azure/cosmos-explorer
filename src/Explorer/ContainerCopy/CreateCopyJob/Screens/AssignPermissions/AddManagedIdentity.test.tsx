import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DatabaseAccount } from "Contracts/DataModels";
import { CopyJobContextProviderType } from "Explorer/ContainerCopy/Types/CopyJobTypes";
import React from "react";
import { updateSystemIdentity } from "../../../../../Utils/arm/identityUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import AddManagedIdentity from "./AddManagedIdentity";

jest.mock("../../../../../Utils/arm/identityUtils", () => ({
  updateSystemIdentity: jest.fn(),
}));

jest.mock("@fluentui/react", () => ({
  ...jest.requireActual("@fluentui/react"),
  getTheme: () => ({
    semanticColors: {
      bodySubtext: "#666666",
      errorIcon: "#d13438",
      successIcon: "#107c10",
    },
    palette: {
      themePrimary: "#0078d4",
    },
  }),
  mergeStyles: () => "mocked-styles",
  mergeStyleSets: (styleSet: any) => {
    const result: any = {};
    Object.keys(styleSet).forEach((key) => {
      result[key] = "mocked-style-" + key;
    });
    return result;
  },
}));

jest.mock("../../../CopyJobUtils", () => ({
  getAccountDetailsFromResourceId: jest.fn(() => ({
    subscriptionId: "test-subscription-id",
    resourceGroup: "test-resource-group",
    accountName: "test-account-name",
  })),
}));

jest.mock("../../../../../Common/Logger", () => ({
  logError: jest.fn(),
}));

const mockUpdateSystemIdentity = updateSystemIdentity as jest.MockedFunction<typeof updateSystemIdentity>;

describe("AddManagedIdentity", () => {
  const mockCopyJobState = {
    jobName: "test-job",
    migrationType: "Offline" as any,
    source: {
      subscription: { subscriptionId: "source-sub-id" },
      account: { id: "source-account-id", name: "source-account-name" },
      databaseId: "source-db",
      containerId: "source-container",
    },
    target: {
      subscriptionId: "target-sub-id",
      account: {
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
        name: "test-target-account",
      },
      databaseId: "target-db",
      containerId: "target-container",
    },
    sourceReadAccessFromTarget: false,
  };

  const mockContextValue = {
    copyJobState: mockCopyJobState,
    setCopyJobState: jest.fn(),
    flow: { currentScreen: "AssignPermissions" },
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: {} as any,
    contextError: "",
    setContextError: jest.fn(),
  } as unknown as CopyJobContextProviderType;

  const renderWithContext = (contextValue = mockContextValue) => {
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <AddManagedIdentity />
      </CopyJobContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSystemIdentity.mockResolvedValue({
      id: "updated-account-id",
      name: "updated-account-name",
    } as any);
  });

  describe("Snapshot Tests", () => {
    it("renders initial state correctly", () => {
      const { container } = renderWithContext();
      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders with toggle on and popover visible", () => {
      const { container } = renderWithContext();

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("renders loading state", async () => {
      mockUpdateSystemIdentity.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100)),
      );

      const { container } = renderWithContext();

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      const primaryButton = screen.getByText("Yes");
      fireEvent.click(primaryButton);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Component Rendering", () => {
    it("renders all required elements", () => {
      renderWithContext();

      expect(screen.getByText(ContainerCopyMessages.addManagedIdentity.description)).toBeInTheDocument();
      expect(screen.getByText(ContainerCopyMessages.addManagedIdentity.descriptionHrefText)).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("renders description link with correct href", () => {
      renderWithContext();

      const link = screen.getByText(ContainerCopyMessages.addManagedIdentity.descriptionHrefText);
      expect(link.closest("a")).toHaveAttribute("href", ContainerCopyMessages.addManagedIdentity.descriptionHref);
      expect(link.closest("a")).toHaveAttribute("target", "_blank");
      expect(link.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("toggle shows correct initial state", () => {
      renderWithContext();

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();
    });
  });

  describe("Toggle Functionality", () => {
    it("toggles state when clicked", () => {
      renderWithContext();

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();

      fireEvent.click(toggle);
      expect(toggle).toBeChecked();

      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it("shows popover when toggle is on", () => {
      renderWithContext();

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(screen.getByText(ContainerCopyMessages.addManagedIdentity.enablementTitle)).toBeInTheDocument();
    });

    it("hides popover when toggle is off", () => {
      renderWithContext();

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      expect(screen.queryByText(ContainerCopyMessages.addManagedIdentity.enablementTitle)).not.toBeInTheDocument();
    });
  });

  describe("Popover Functionality", () => {
    beforeEach(() => {
      renderWithContext();
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
    });

    it("displays correct enablement description with account name", () => {
      const expectedDescription = ContainerCopyMessages.addManagedIdentity.enablementDescription(
        mockCopyJobState.target.account.name,
      );
      expect(screen.getByText(expectedDescription)).toBeInTheDocument();
    });

    it("calls handleAddSystemIdentity when primary button clicked", async () => {
      const primaryButton = screen.getByText("Yes");
      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockUpdateSystemIdentity).toHaveBeenCalledWith(
          "test-subscription-id",
          "test-resource-group",
          "test-account-name",
        );
      });
    });

    it.skip("closes popover when cancel button clicked", () => {
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByText(ContainerCopyMessages.addManagedIdentity.enablementTitle)).not.toBeInTheDocument();

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();
    });
  });

  describe("Managed Identity Operations", () => {
    it("successfully updates system identity", async () => {
      const setCopyJobState = jest.fn();
      const contextWithMockSetter = {
        ...mockContextValue,
        setCopyJobState,
      };

      renderWithContext(contextWithMockSetter);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      const primaryButton = screen.getByText("Yes");
      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockUpdateSystemIdentity).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(setCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it("handles error during identity update", async () => {
      const setContextError = jest.fn();
      const contextWithErrorHandler = {
        ...mockContextValue,
        setContextError,
      };

      const errorMessage = "Failed to update identity";
      mockUpdateSystemIdentity.mockRejectedValue(new Error(errorMessage));

      renderWithContext(contextWithErrorHandler);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      const primaryButton = screen.getByText("Yes");
      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(setContextError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles missing target account gracefully", () => {
      const contextWithoutTargetAccount = {
        ...mockContextValue,
        copyJobState: {
          ...mockCopyJobState,
          target: {
            ...mockCopyJobState.target,
            account: null as DatabaseAccount | null,
          },
        },
      } as unknown as CopyJobContextProviderType;

      expect(() => renderWithContext(contextWithoutTargetAccount)).not.toThrow();
    });
  });
});
