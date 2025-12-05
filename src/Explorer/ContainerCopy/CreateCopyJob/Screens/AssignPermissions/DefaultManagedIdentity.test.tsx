import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { updateDefaultIdentity } from "../../../../../Utils/arm/identityUtils";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import DefaultManagedIdentity from "./DefaultManagedIdentity";

jest.mock("./hooks/useManagedIdentity");
jest.mock("./hooks/useToggle");

jest.mock("../../../../../Utils/arm/identityUtils", () => ({
  updateDefaultIdentity: jest.fn(),
}));

jest.mock("../Components/InfoTooltip", () => {
  return function MockInfoTooltip({ content }: { content: React.ReactNode }) {
    return <div data-testid="info-tooltip">{content}</div>;
  };
});

jest.mock("../Components/PopoverContainer", () => {
  return function MockPopoverMessage({
    children,
    isLoading,
    visible,
    title,
    onCancel,
    onPrimary,
  }: {
    children: React.ReactNode;
    isLoading: boolean;
    visible: boolean;
    title: string;
    onCancel: () => void;
    onPrimary: () => void;
  }) {
    if (!visible) return null;
    return (
      <div data-testid="popover-message">
        <div data-testid="popover-title">{title}</div>
        <div data-testid="popover-content">{children}</div>
        <div data-testid="popover-loading">{isLoading ? "Loading" : "Not Loading"}</div>
        <button data-testid="popover-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button data-testid="popover-primary" onClick={onPrimary}>
          Primary
        </button>
      </div>
    );
  };
});

import { DatabaseAccount } from "Contracts/DataModels";
import { CopyJobContextProviderType } from "Explorer/ContainerCopy/Types/CopyJobTypes";
import useManagedIdentity from "./hooks/useManagedIdentity";
import useToggle from "./hooks/useToggle";

const mockUseManagedIdentity = useManagedIdentity as jest.MockedFunction<typeof useManagedIdentity>;
const mockUseToggle = useToggle as jest.MockedFunction<typeof useToggle>;

describe("DefaultManagedIdentity", () => {
  const mockCopyJobContextValue = {
    copyJobState: {
      target: {
        account: {
          name: "test-cosmos-account",
          id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-cosmos-account",
        },
      },
    },
    setCopyJobState: jest.fn(),
    setContextError: jest.fn(),
    contextError: "",
    flow: {},
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: {} as any,
  };

  const mockHandleAddSystemIdentity = jest.fn();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseManagedIdentity.mockReturnValue({
      loading: false,
      handleAddSystemIdentity: mockHandleAddSystemIdentity,
    });

    mockUseToggle.mockReturnValue([false, mockOnToggle]);
  });

  const renderComponent = (contextValue = mockCopyJobContextValue) => {
    return render(
      <CopyJobContext.Provider value={contextValue as unknown as CopyJobContextProviderType}>
        <DefaultManagedIdentity />
      </CopyJobContext.Provider>,
    );
  };

  describe("Rendering", () => {
    it("should render correctly with default state", () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it("should render the description with account name", () => {
      renderComponent();

      const description = screen.getByText(
        /Set the system-assigned managed identity as default for "test-cosmos-account"/,
      );
      expect(description).toBeInTheDocument();
    });

    it("should render the info tooltip", () => {
      renderComponent();

      const tooltip = screen.getByTestId("info-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("Learn more about");
      expect(tooltip).toHaveTextContent("Default Managed Identities.");
    });

    it("should render the toggle button with correct initial state", () => {
      renderComponent();

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
    });

    it("should not show popover when toggle is false", () => {
      renderComponent();

      const popover = screen.queryByTestId("popover-message");
      expect(popover).not.toBeInTheDocument();
    });
  });

  describe("Toggle Interactions", () => {
    it("should call onToggle when toggle is clicked", () => {
      renderComponent();

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("should show popover when toggle is true", () => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);

      renderComponent();

      const popover = screen.getByTestId("popover-message");
      expect(popover).toBeInTheDocument();

      const title = screen.getByTestId("popover-title");
      expect(title).toHaveTextContent(ContainerCopyMessages.defaultManagedIdentity.popoverTitle);

      const content = screen.getByTestId("popover-content");
      expect(content).toHaveTextContent(
        /Assign the system-assigned managed identity as the default for "test-cosmos-account"/,
      );
    });

    it("should render toggle with checked state when toggle is true", () => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);

      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe("Loading States", () => {
    it("should show loading state in popover when loading is true", () => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);
      mockUseManagedIdentity.mockReturnValue({
        loading: true,
        handleAddSystemIdentity: mockHandleAddSystemIdentity,
      });

      renderComponent();

      const loadingIndicator = screen.getByTestId("popover-loading");
      expect(loadingIndicator).toHaveTextContent("Loading");
    });

    it("should not show loading state when loading is false", () => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);

      renderComponent();

      const loadingIndicator = screen.getByTestId("popover-loading");
      expect(loadingIndicator).toHaveTextContent("Not Loading");
    });

    it("should render loading state snapshot", () => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);
      mockUseManagedIdentity.mockReturnValue({
        loading: true,
        handleAddSystemIdentity: mockHandleAddSystemIdentity,
      });

      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe("Popover Interactions", () => {
    beforeEach(() => {
      mockUseToggle.mockReturnValue([true, mockOnToggle]);
    });

    it("should call onToggle with false when cancel button is clicked", () => {
      renderComponent();

      const cancelButton = screen.getByTestId("popover-cancel");
      fireEvent.click(cancelButton);

      expect(mockOnToggle).toHaveBeenCalledWith(null, false);
    });

    it("should call handleAddSystemIdentity when primary button is clicked", () => {
      renderComponent();

      const primaryButton = screen.getByTestId("popover-primary");
      fireEvent.click(primaryButton);

      expect(mockHandleAddSystemIdentity).toHaveBeenCalledTimes(1);
    });

    it("should handle primary button click correctly when loading", async () => {
      mockUseManagedIdentity.mockReturnValue({
        loading: true,
        handleAddSystemIdentity: mockHandleAddSystemIdentity,
      });

      renderComponent();

      const primaryButton = screen.getByTestId("popover-primary");
      fireEvent.click(primaryButton);

      expect(mockHandleAddSystemIdentity).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing account name gracefully", () => {
      const contextValueWithoutAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          target: {
            account: {
              name: "",
              id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/",
            },
          },
        },
      };

      const { container } = renderComponent(contextValueWithoutAccount);
      expect(container).toMatchSnapshot();
    });

    it("should handle null account", () => {
      const contextValueWithNullAccount = {
        ...mockCopyJobContextValue,
        copyJobState: {
          target: {
            account: null as DatabaseAccount | null,
          },
        },
      };

      const { container } = renderComponent(contextValueWithNullAccount);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Hook Integration", () => {
    it("should pass updateDefaultIdentity to useManagedIdentity hook", () => {
      renderComponent();

      expect(mockUseManagedIdentity).toHaveBeenCalledWith(updateDefaultIdentity);
    });

    it("should initialize useToggle with false", () => {
      renderComponent();

      expect(mockUseToggle).toHaveBeenCalledWith(false);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      renderComponent();

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
    });

    it("should have proper link accessibility", () => {
      renderComponent();

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Component Structure", () => {
    it("should have correct CSS class", () => {
      const { container } = renderComponent();

      const componentContainer = container.querySelector(".defaultManagedIdentityContainer");
      expect(componentContainer).toBeInTheDocument();
    });

    it("should render all required FluentUI components", () => {
      renderComponent();

      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByRole("link")).toBeInTheDocument();
    });
  });

  describe("Messages and Text Content", () => {
    it("should display correct toggle button text", () => {
      renderComponent();

      const onText = screen.queryByText(ContainerCopyMessages.toggleBtn.onText);
      const offText = screen.queryByText(ContainerCopyMessages.toggleBtn.offText);

      expect(onText || offText).toBeTruthy();
    });

    it("should display correct link text in tooltip", () => {
      renderComponent();

      const linkText = screen.getByText(ContainerCopyMessages.defaultManagedIdentity.tooltip.hrefText);
      expect(linkText).toBeInTheDocument();
    });
  });
});
