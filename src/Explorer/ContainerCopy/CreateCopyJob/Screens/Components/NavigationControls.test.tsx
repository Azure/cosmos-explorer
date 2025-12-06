import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import NavigationControls from "./NavigationControls";

describe("NavigationControls", () => {
  const defaultProps = {
    primaryBtnText: "Next",
    onPrimary: jest.fn(),
    onPrevious: jest.fn(),
    onCancel: jest.fn(),
    isPrimaryDisabled: false,
    isPreviousDisabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all buttons with correct text", () => {
    render(<NavigationControls {...defaultProps} />);

    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders primary button with custom text", () => {
    const customProps = {
      ...defaultProps,
      primaryBtnText: "Complete",
    };
    render(<NavigationControls {...customProps} />);

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("calls onPrimary when primary button is clicked", () => {
    render(<NavigationControls {...defaultProps} />);

    fireEvent.click(screen.getByText("Next"));
    expect(defaultProps.onPrimary).toHaveBeenCalledTimes(1);
  });

  it("calls onPrevious when previous button is clicked", () => {
    render(<NavigationControls {...defaultProps} />);

    fireEvent.click(screen.getByText("Previous"));
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<NavigationControls {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables primary button when isPrimaryDisabled is true", () => {
    const disabledProps = {
      ...defaultProps,
      isPrimaryDisabled: true,
    };
    render(<NavigationControls {...disabledProps} />);
    const primaryButton = screen.getByText("Next").closest("button");
    expect(primaryButton).toHaveAttribute("aria-disabled", "true");
    expect(primaryButton).toHaveAttribute("data-is-focusable", "true");
  });

  it("disables previous button when isPreviousDisabled is true", () => {
    const disabledProps = {
      ...defaultProps,
      isPreviousDisabled: true,
    };
    render(<NavigationControls {...disabledProps} />);

    const previousButton = screen.getByText("Previous").closest("button");
    expect(previousButton).toHaveAttribute("aria-disabled", "true");
    expect(previousButton).toHaveAttribute("data-is-focusable", "true");
  });

  it("does not call onPrimary when disabled primary button is clicked", () => {
    const disabledProps = {
      ...defaultProps,
      isPrimaryDisabled: true,
    };
    render(<NavigationControls {...disabledProps} />);

    fireEvent.click(screen.getByText("Next"));
    expect(defaultProps.onPrimary).not.toHaveBeenCalled();
  });

  it("does not call onPrevious when disabled previous button is clicked", () => {
    const disabledProps = {
      ...defaultProps,
      isPreviousDisabled: true,
    };
    render(<NavigationControls {...disabledProps} />);

    fireEvent.click(screen.getByText("Previous"));
    expect(defaultProps.onPrevious).not.toHaveBeenCalled();
  });

  it("enables both buttons when neither is disabled", () => {
    render(<NavigationControls {...defaultProps} />);

    expect(screen.getByText("Next").closest("button")).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Previous").closest("button")).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Cancel").closest("button")).not.toHaveAttribute("aria-disabled");
  });
});
