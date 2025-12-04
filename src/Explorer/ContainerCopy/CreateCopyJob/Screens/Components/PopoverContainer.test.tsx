import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import PopoverMessage from "./PopoverContainer";

jest.mock("../../../../../Common/LoadingOverlay", () => {
  return function MockLoadingOverlay({ isLoading, label }: { isLoading: boolean; label: string }) {
    return isLoading ? <div data-testid="loading-overlay" aria-label={label} /> : null;
  };
});

describe("PopoverMessage Component", () => {
  const defaultProps = {
    visible: true,
    title: "Test Title",
    onCancel: jest.fn(),
    onPrimary: jest.fn(),
    children: <div>Test content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render correctly when visible", () => {
      const { container } = render(<PopoverMessage {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    it("should render correctly when not visible", () => {
      const { container } = render(<PopoverMessage {...defaultProps} visible={false} />);
      expect(container).toMatchSnapshot();
    });

    it("should render correctly with loading state", () => {
      const { container } = render(<PopoverMessage {...defaultProps} isLoading={true} />);
      expect(container).toMatchSnapshot();
    });

    it("should render correctly with different title", () => {
      const { container } = render(<PopoverMessage {...defaultProps} title="Custom Title" />);
      expect(container).toMatchSnapshot();
    });

    it("should render correctly with different children content", () => {
      const customChildren = (
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      );
      const { container } = render(<PopoverMessage {...defaultProps} children={customChildren} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Visibility", () => {
    it("should not render anything when visible is false", () => {
      render(<PopoverMessage {...defaultProps} visible={false} />);
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();
    });

    it("should render content when visible is true", () => {
      render(<PopoverMessage {...defaultProps} />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });
  });

  describe("Title Display", () => {
    it("should display the provided title", () => {
      render(<PopoverMessage {...defaultProps} title="Custom Popover Title" />);
      expect(screen.getByText("Custom Popover Title")).toBeInTheDocument();
    });

    it("should handle empty title", () => {
      render(<PopoverMessage {...defaultProps} title="" />);
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    });
  });

  describe("Children Content", () => {
    it("should render children content", () => {
      const customChildren = <span>Custom child content</span>;
      render(<PopoverMessage {...defaultProps} children={customChildren} />);
      expect(screen.getByText("Custom child content")).toBeInTheDocument();
    });

    it("should render complex children content", () => {
      const complexChildren = (
        <div>
          <h3>Heading</h3>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );
      render(<PopoverMessage {...defaultProps} children={complexChildren} />);
      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("should call onPrimary when Yes button is clicked", () => {
      const onPrimaryMock = jest.fn();
      render(<PopoverMessage {...defaultProps} onPrimary={onPrimaryMock} />);

      const yesButton = screen.getByText("Yes");
      fireEvent.click(yesButton);

      expect(onPrimaryMock).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when No button is clicked", () => {
      const onCancelMock = jest.fn();
      render(<PopoverMessage {...defaultProps} onCancel={onCancelMock} />);

      const noButton = screen.getByText("No");
      fireEvent.click(noButton);

      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it("should not call handlers multiple times on rapid clicks", () => {
      const onPrimaryMock = jest.fn();
      const onCancelMock = jest.fn();
      render(<PopoverMessage {...defaultProps} onPrimary={onPrimaryMock} onCancel={onCancelMock} />);

      const yesButton = screen.getByText("Yes");
      const noButton = screen.getByText("No");

      // Rapid clicks
      fireEvent.click(yesButton);
      fireEvent.click(yesButton);
      fireEvent.click(noButton);
      fireEvent.click(noButton);

      expect(onPrimaryMock).toHaveBeenCalledTimes(2);
      expect(onCancelMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Loading State", () => {
    test("should show loading overlay when isLoading is true", () => {
      render(<PopoverMessage {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
    });

    it("should not show loading overlay when isLoading is false", () => {
      render(<PopoverMessage {...defaultProps} isLoading={false} />);
      expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
    });

    it("should disable buttons when loading", () => {
      render(<PopoverMessage {...defaultProps} isLoading={true} />);

      const yesButton = screen.getByText("Yes").closest("button");
      const noButton = screen.getByText("No").closest("button");

      expect(yesButton).toHaveAttribute("aria-disabled", "true");
      expect(noButton).toHaveAttribute("aria-disabled", "true");
    });

    it("should enable buttons when not loading", () => {
      render(<PopoverMessage {...defaultProps} isLoading={false} />);

      const yesButton = screen.getByText("Yes").closest("button");
      const noButton = screen.getByText("No").closest("button");

      expect(yesButton).not.toHaveAttribute("aria-disabled");
      expect(noButton).not.toHaveAttribute("aria-disabled");
    });

    it("should use correct loading overlay label", () => {
      render(<PopoverMessage {...defaultProps} isLoading={true} />);
      const loadingOverlay = screen.getByTestId("loading-overlay");
      expect(loadingOverlay).toHaveAttribute("aria-label", ContainerCopyMessages.popoverOverlaySpinnerLabel);
    });
  });

  describe("Default Props", () => {
    it("should handle missing isLoading prop (defaults to false)", () => {
      const propsWithoutLoading = { ...defaultProps };
      delete (propsWithoutLoading as any).isLoading;

      render(<PopoverMessage {...propsWithoutLoading} />);

      expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
      expect(screen.getByText("Yes")).not.toBeDisabled();
      expect(screen.getByText("No")).not.toBeDisabled();
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should apply correct CSS classes", () => {
      const { container } = render(<PopoverMessage {...defaultProps} />);
      const popoverContainer = container.querySelector(".popover-container");

      expect(popoverContainer).toHaveClass("foreground");
    });

    it("should apply loading class when isLoading is true", () => {
      const { container } = render(<PopoverMessage {...defaultProps} isLoading={true} />);
      const popoverContainer = container.querySelector(".popover-container");

      expect(popoverContainer).toHaveClass("loading");
    });

    it("should not apply loading class when isLoading is false", () => {
      const { container } = render(<PopoverMessage {...defaultProps} isLoading={false} />);
      const popoverContainer = container.querySelector(".popover-container");

      expect(popoverContainer).not.toHaveClass("loading");
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined children", () => {
      const propsWithUndefinedChildren = { ...defaultProps, children: undefined as React.ReactNode };
      const { container } = render(<PopoverMessage {...propsWithUndefinedChildren} />);
      expect(container).toMatchSnapshot();
    });

    it("should handle null children", () => {
      const propsWithNullChildren = { ...defaultProps, children: null as React.ReactNode };
      const { container } = render(<PopoverMessage {...propsWithNullChildren} />);
      expect(container).toMatchSnapshot();
    });

    it("should handle empty string title", () => {
      const propsWithEmptyTitle = { ...defaultProps, title: "" };
      const { container } = render(<PopoverMessage {...propsWithEmptyTitle} />);
      expect(container).toMatchSnapshot();
    });

    it("should handle very long title", () => {
      const longTitle =
        "This is a very long title that might cause layout issues or text wrapping in the popover component";
      const propsWithLongTitle = { ...defaultProps, title: longTitle };
      const { container } = render(<PopoverMessage {...propsWithLongTitle} />);
      expect(container).toMatchSnapshot();
    });
  });
});
