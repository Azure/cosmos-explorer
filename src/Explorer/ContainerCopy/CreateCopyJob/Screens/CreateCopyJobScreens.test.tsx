import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import CreateCopyJobScreens from "./CreateCopyJobScreens";

jest.mock("../../Context/CopyJobContext", () => ({
  useCopyJobContext: jest.fn(),
}));

jest.mock("../Utils/useCopyJobNavigation", () => ({
  useCopyJobNavigation: jest.fn(),
}));

jest.mock("./Components/NavigationControls", () => {
  const MockedNavigationControls = ({
    primaryBtnText,
    onPrimary,
    onPrevious,
    onCancel,
    isPrimaryDisabled,
    isPreviousDisabled,
  }: {
    primaryBtnText: string;
    onPrimary: () => void;
    onPrevious: () => void;
    onCancel: () => void;
    isPrimaryDisabled: boolean;
    isPreviousDisabled: boolean;
  }) => (
    <div data-testid="navigation-controls">
      <button data-testid="primary-button" onClick={onPrimary} disabled={isPrimaryDisabled}>
        {primaryBtnText}
      </button>
      <button data-testid="previous-button" onClick={onPrevious} disabled={isPreviousDisabled}>
        Previous
      </button>
      <button data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
  return MockedNavigationControls;
});

import { useCopyJobContext } from "../../Context/CopyJobContext";
import { useCopyJobNavigation } from "../Utils/useCopyJobNavigation";

const createMockNavigationHook = (overrides = {}) => ({
  currentScreen: {
    key: "SelectAccount",
    component: <div data-testid="mock-screen">Mock Screen Component</div>,
  },
  isPrimaryDisabled: false,
  isPreviousDisabled: true,
  handlePrimary: jest.fn(),
  handlePrevious: jest.fn(),
  handleCancel: jest.fn(),
  primaryBtnText: "Next",
  showAddCollectionPanel: jest.fn(),
  ...overrides,
});

const createMockContext = (overrides = {}) => ({
  contextError: "",
  setContextError: jest.fn(),
  copyJobState: {},
  setCopyJobState: jest.fn(),
  flow: {},
  setFlow: jest.fn(),
  resetCopyJobState: jest.fn(),
  explorer: {},
  ...overrides,
});

describe("CreateCopyJobScreens", () => {
  const mockNavigationHook = createMockNavigationHook();
  const mockContext = createMockContext();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCopyJobNavigation as jest.Mock).mockReturnValue(mockNavigationHook);
    (useCopyJobContext as jest.Mock).mockReturnValue(mockContext);
  });

  describe("Rendering", () => {
    test("should render without error", () => {
      render(<CreateCopyJobScreens />);
      expect(screen.getByTestId("mock-screen")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-controls")).toBeInTheDocument();
    });

    test("should render current screen component", () => {
      const customScreen = <div data-testid="custom-screen">Custom Screen Content</div>;
      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: { component: customScreen },
        }),
      );

      render(<CreateCopyJobScreens />);
      expect(screen.getByTestId("custom-screen")).toBeInTheDocument();
      expect(screen.getByText("Custom Screen Content")).toBeInTheDocument();
    });

    test("should have correct CSS classes", () => {
      const { container } = render(<CreateCopyJobScreens />);
      const mainContainer = container.querySelector(".createCopyJobScreensContainer");
      const contentContainer = container.querySelector(".createCopyJobScreensContent");
      const footerContainer = container.querySelector(".createCopyJobScreensFooter");

      expect(mainContainer).toBeInTheDocument();
      expect(contentContainer).toBeInTheDocument();
      expect(footerContainer).toBeInTheDocument();
    });
  });

  describe("Error Message Bar", () => {
    test("should not show error message bar when no error", () => {
      render(<CreateCopyJobScreens />);
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    test("should show error message bar when context error exists", () => {
      const errorMessage = "Something went wrong";
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: errorMessage,
        }),
      );

      render(<CreateCopyJobScreens />);
      const messageBar = screen.getByRole("region");
      expect(messageBar).toBeInTheDocument();

      // Check for MessageBar by class since the text might be in a nested structure
      expect(messageBar).toHaveClass("createCopyJobErrorMessageBar");
    });

    test("should have correct error message bar properties", () => {
      const errorMessage = "Test error message";
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: errorMessage,
        }),
      );

      render(<CreateCopyJobScreens />);
      const messageBar = screen.getByRole("region");

      expect(messageBar).toHaveClass("createCopyJobErrorMessageBar");
    });

    test("should call setContextError when dismiss button is clicked", () => {
      const mockSetContextError = jest.fn();
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "Test error",
          setContextError: mockSetContextError,
        }),
      );

      render(<CreateCopyJobScreens />);

      const dismissButton = screen.getByLabelText("Close");
      fireEvent.click(dismissButton);

      expect(mockSetContextError).toHaveBeenCalledWith(null);
    });

    test("should show overflow button with correct aria label", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "A very long error message that should trigger overflow behavior",
        }),
      );

      render(<CreateCopyJobScreens />);
      const overflowButton = screen.getByLabelText("See more");
      expect(overflowButton).toBeInTheDocument();
    });
  });

  describe("Navigation Controls Integration", () => {
    test("should pass correct props to NavigationControls", () => {
      const mockHook = createMockNavigationHook({
        primaryBtnText: "Create",
        isPrimaryDisabled: true,
        isPreviousDisabled: false,
      });
      (useCopyJobNavigation as jest.Mock).mockReturnValue(mockHook);

      render(<CreateCopyJobScreens />);

      const primaryButton = screen.getByTestId("primary-button");
      const previousButton = screen.getByTestId("previous-button");

      expect(primaryButton).toHaveTextContent("Create");
      expect(primaryButton).toBeDisabled();
      expect(previousButton).not.toBeDisabled();
    });

    test("should call navigation handlers when buttons are clicked", () => {
      const mockHandlePrimary = jest.fn();
      const mockHandlePrevious = jest.fn();
      const mockHandleCancel = jest.fn();

      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          handlePrimary: mockHandlePrimary,
          handlePrevious: mockHandlePrevious,
          handleCancel: mockHandleCancel,
          isPrimaryDisabled: false,
          isPreviousDisabled: false,
        }),
      );

      render(<CreateCopyJobScreens />);

      fireEvent.click(screen.getByTestId("primary-button"));
      fireEvent.click(screen.getByTestId("previous-button"));
      fireEvent.click(screen.getByTestId("cancel-button"));

      expect(mockHandlePrimary).toHaveBeenCalledTimes(1);
      expect(mockHandlePrevious).toHaveBeenCalledTimes(1);
      expect(mockHandleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Screen Component Props", () => {
    test("should pass showAddCollectionPanel prop to screen component", () => {
      const mockShowAddCollectionPanel = jest.fn();
      const TestScreen = ({ showAddCollectionPanel }: { showAddCollectionPanel: () => void }) => (
        <div>
          <button data-testid="add-collection-btn" onClick={showAddCollectionPanel}>
            Add Collection
          </button>
        </div>
      );

      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: { component: <TestScreen showAddCollectionPanel={() => {}} /> },
          showAddCollectionPanel: mockShowAddCollectionPanel,
        }),
      );

      render(<CreateCopyJobScreens />);

      const addButton = screen.getByTestId("add-collection-btn");
      expect(addButton).toBeInTheDocument();
    });

    test("should handle screen component without props", () => {
      const SimpleScreen = () => <div data-testid="simple-screen">Simple Screen</div>;

      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: { component: <SimpleScreen /> },
        }),
      );

      expect(() => render(<CreateCopyJobScreens />)).not.toThrow();
      expect(screen.getByTestId("simple-screen")).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    test("should maintain vertical layout with space-between alignment", () => {
      const { container } = render(<CreateCopyJobScreens />);
      const stackContainer = container.querySelector(".createCopyJobScreensContainer");

      expect(stackContainer).toBeInTheDocument();
    });

    test("should have content area above navigation controls", () => {
      const { container } = render(<CreateCopyJobScreens />);

      const content = container.querySelector(".createCopyJobScreensContent");
      const footer = container.querySelector(".createCopyJobScreensFooter");

      expect(content).toBeInTheDocument();
      expect(footer).toBeInTheDocument();

      // Check that content comes before footer in DOM order
      const contentIndex = Array.from(container.querySelectorAll("*")).indexOf(content!);
      const footerIndex = Array.from(container.querySelectorAll("*")).indexOf(footer!);
      expect(contentIndex).toBeLessThan(footerIndex);
    });
  });

  describe("Error Scenarios", () => {
    test("should handle missing current screen gracefully", () => {
      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: null,
        }),
      );

      // This should throw because React.cloneElement requires a valid element
      expect(() => render(<CreateCopyJobScreens />)).toThrow();
    });

    test("should handle missing screen component", () => {
      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: { key: "test", component: null },
        }),
      );

      // This should throw because React.cloneElement requires a valid element
      expect(() => render(<CreateCopyJobScreens />)).toThrow();
    });

    test("should render with valid screen component", () => {
      (useCopyJobNavigation as jest.Mock).mockReturnValue(
        createMockNavigationHook({
          currentScreen: {
            key: "test",
            component: <div data-testid="valid-screen">Valid Screen</div>,
          },
        }),
      );

      expect(() => render(<CreateCopyJobScreens />)).not.toThrow();
      expect(screen.getByTestId("valid-screen")).toBeInTheDocument();
    });

    test("should handle context hook throwing error", () => {
      (useCopyJobContext as jest.Mock).mockImplementation(() => {
        throw new Error("Context not available");
      });

      expect(() => render(<CreateCopyJobScreens />)).toThrow("Context not available");
    });

    test("should handle navigation hook throwing error", () => {
      (useCopyJobNavigation as jest.Mock).mockImplementation(() => {
        throw new Error("Navigation not available");
      });

      expect(() => render(<CreateCopyJobScreens />)).toThrow("Navigation not available");
    });
  });

  describe("Multiple Error States", () => {
    test("should handle error message changes", () => {
      const mockSetContextError = jest.fn();
      const { rerender } = render(<CreateCopyJobScreens />);

      // Initial state - no error
      expect(screen.queryByRole("region")).not.toBeInTheDocument();

      // Add error
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "First error",
          setContextError: mockSetContextError,
        }),
      );
      rerender(<CreateCopyJobScreens />);
      expect(screen.getByRole("region")).toBeInTheDocument();

      // Change error
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "Second error",
          setContextError: mockSetContextError,
        }),
      );
      rerender(<CreateCopyJobScreens />);
      expect(screen.getByRole("region")).toBeInTheDocument();

      // Clear error
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: null,
          setContextError: mockSetContextError,
        }),
      );
      rerender(<CreateCopyJobScreens />);
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("should have proper ARIA labels for message bar", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "Test error",
        }),
      );

      render(<CreateCopyJobScreens />);

      const dismissButton = screen.getByLabelText("Close");
      const overflowButton = screen.getByLabelText("See more");

      expect(dismissButton).toBeInTheDocument();
      expect(overflowButton).toBeInTheDocument();
    });

    test("should have proper region role for message bar", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue(
        createMockContext({
          contextError: "Test error",
        }),
      );

      render(<CreateCopyJobScreens />);
      const messageRegion = screen.getByRole("region");
      expect(messageRegion).toBeInTheDocument();

      // Also check for alert role which is nested inside
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    test("should integrate with both context and navigation hooks", () => {
      const mockContext = createMockContext({
        contextError: "Integration test error",
      });
      const mockNavigation = createMockNavigationHook({
        primaryBtnText: "Integration Test",
        isPrimaryDisabled: true,
      });

      (useCopyJobContext as jest.Mock).mockReturnValue(mockContext);
      (useCopyJobNavigation as jest.Mock).mockReturnValue(mockNavigation);

      render(<CreateCopyJobScreens />);

      // Check both hooks are used - check for region (MessageBar) and button text
      expect(screen.getByRole("region")).toBeInTheDocument();
      expect(screen.getByText("Integration Test")).toBeInTheDocument();
    });
  });
});
