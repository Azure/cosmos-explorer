import { render } from "@testing-library/react";
import React from "react";
import LoadingOverlay from "./LoadingOverlay";

describe("LoadingOverlay", () => {
  const defaultProps = {
    isLoading: true,
    label: "Loading...",
  };

  it("should render loading overlay when isLoading is true", () => {
    const { container } = render(<LoadingOverlay {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render loading overlay with custom label", () => {
    const customProps = {
      isLoading: true,
      label: "Processing your request...",
    };
    const { container } = render(<LoadingOverlay {...customProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render loading overlay with empty label", () => {
    const emptyLabelProps = {
      isLoading: true,
      label: "",
    };
    const { container } = render(<LoadingOverlay {...emptyLabelProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should return null when isLoading is false", () => {
    const notLoadingProps = {
      isLoading: false,
      label: "Loading...",
    };
    const { container } = render(<LoadingOverlay {...notLoadingProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("should handle long labels properly", () => {
    const longLabelProps = {
      isLoading: true,
      label:
        "This is a very long loading message that might span multiple lines and should still render correctly in the loading overlay component",
    };
    const { container } = render(<LoadingOverlay {...longLabelProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
