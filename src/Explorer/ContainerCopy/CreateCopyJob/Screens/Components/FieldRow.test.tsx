import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import FieldRow from "./FieldRow";

describe("FieldRow", () => {
  const mockChildContent = "Test Child Content";
  const testLabel = "Test Label";
  const customClassName = "custom-label-class";

  describe("Component Rendering", () => {
    it("renders the component with correct structure", () => {
      const { container } = render(
        <FieldRow label={testLabel}>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      expect(container.firstChild).toHaveClass("flex-row");
      expect(screen.getByText(`${testLabel}:`)).toBeInTheDocument();
      expect(screen.getByText(mockChildContent)).toBeInTheDocument();
    });

    it("renders children content correctly", () => {
      render(
        <FieldRow label={testLabel}>
          <input type="text" data-test="test-input" />
          <button data-test="test-button">Click me</button>
        </FieldRow>,
      );

      expect(screen.getByTestId("test-input")).toBeInTheDocument();
      expect(screen.getByTestId("test-button")).toBeInTheDocument();
    });

    it("renders complex children components correctly", () => {
      const ComplexChild = () => (
        <div>
          <span>Nested content</span>
          <input type="text" placeholder="Enter value" />
        </div>
      );

      render(
        <FieldRow label={testLabel}>
          <ComplexChild />
        </FieldRow>,
      );

      expect(screen.getByText("Nested content")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    });

    it("does not render label when not provided", () => {
      const { container } = render(
        <FieldRow>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      expect(container.querySelector("label")).not.toBeInTheDocument();
      expect(screen.getByText(mockChildContent)).toBeInTheDocument();
    });

    it("applies custom label className when provided", () => {
      render(
        <FieldRow label={testLabel} labelClassName={customClassName}>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      const label = screen.getByText(`${testLabel}:`);
      expect(label).toHaveClass("field-label", customClassName);
    });
  });

  describe("CSS Classes and Styling", () => {
    it("applies default CSS classes correctly", () => {
      const { container } = render(
        <FieldRow label={testLabel}>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      const mainContainer = container.firstChild as Element;
      expect(mainContainer).toHaveClass("flex-row");

      const labelContainer = container.querySelector(".flex-fixed-width");
      expect(labelContainer).toBeInTheDocument();

      const childContainer = container.querySelector(".flex-grow-col");
      expect(childContainer).toBeInTheDocument();

      const label = screen.getByText(`${testLabel}:`);
      expect(label).toHaveClass("field-label");
    });
  });

  describe("Layout and Structure", () => {
    it("uses horizontal Stack with space-between alignment", () => {
      const { container } = render(
        <FieldRow label={testLabel}>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      const mainContainer = container.firstChild as Element;
      expect(mainContainer).toHaveClass("flex-row");
    });

    it("positions label in fixed-width container with center alignment", () => {
      const { container } = render(
        <FieldRow label={testLabel}>
          <div>{mockChildContent}</div>
        </FieldRow>,
      );

      const labelContainer = container.querySelector(".flex-fixed-width");
      expect(labelContainer).toBeInTheDocument();
      expect(labelContainer).toContainElement(screen.getByText(`${testLabel}:`));
    });

    it("positions children in grow container with center alignment", () => {
      const { container } = render(
        <FieldRow label={testLabel}>
          <div data-test="child-content">{mockChildContent}</div>
        </FieldRow>,
      );

      const childContainer = container.querySelector(".flex-grow-col");
      expect(childContainer).toBeInTheDocument();
      expect(childContainer).toContainElement(screen.getByTestId("child-content"));
    });

    it("maintains layout when no label is provided", () => {
      const { container } = render(
        <FieldRow>
          <div data-test="child-content">{mockChildContent}</div>
        </FieldRow>,
      );

      expect(container.firstChild).toHaveClass("flex-row");
      expect(container.querySelector(".flex-fixed-width")).not.toBeInTheDocument();

      const childContainer = container.querySelector(".flex-grow-col");
      expect(childContainer).toBeInTheDocument();
      expect(childContainer).toContainElement(screen.getByTestId("child-content"));
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles null children gracefully", () => {
      render(<FieldRow label={testLabel}>{null}</FieldRow>);

      expect(screen.getByText(`${testLabel}:`)).toBeInTheDocument();
    });

    it("handles zero as children", () => {
      render(<FieldRow label={testLabel}>{0}</FieldRow>);

      expect(screen.getByText(`${testLabel}:`)).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles empty string as children", () => {
      render(<FieldRow label={testLabel}>{""}</FieldRow>);

      expect(screen.getByText(`${testLabel}:`)).toBeInTheDocument();
    });

    it("handles array of children", () => {
      render(<FieldRow label={testLabel}>{[<span key="1">First</span>, <span key="2">Second</span>]}</FieldRow>);

      expect(screen.getByText(`${testLabel}:`)).toBeInTheDocument();
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("Snapshot Testing", () => {
    it("matches snapshot with minimal props", () => {
      const { container } = render(
        <FieldRow>
          <input type="text" placeholder="Simple input" />
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with label only", () => {
      const { container } = render(
        <FieldRow label="Database Name">
          <input type="text" placeholder="Enter database name" />
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with custom className", () => {
      const { container } = render(
        <FieldRow label="Container Name" labelClassName="custom-style">
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with complex children", () => {
      const { container } = render(
        <FieldRow label="Advanced Settings" labelClassName="advanced-label">
          <div>
            <input type="checkbox" id="enable-feature" />
            <label htmlFor="enable-feature">Enable advanced feature</label>
            <button type="button">Configure</button>
          </div>
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with no label", () => {
      const { container } = render(
        <FieldRow>
          <div>
            <h4>Section Title</h4>
            <p>Section description goes here</p>
          </div>
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with empty label", () => {
      const { container } = render(
        <FieldRow label="">
          <button type="submit">Submit Form</button>
        </FieldRow>,
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
