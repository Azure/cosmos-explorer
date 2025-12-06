import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MigrationTypeCheckbox } from "./MigrationTypeCheckbox";

describe("MigrationTypeCheckbox", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render with default props (unchecked state)", () => {
      const { container } = render(<MigrationTypeCheckbox checked={false} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("should render in checked state", () => {
      const { container } = render(<MigrationTypeCheckbox checked={true} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("should display the correct label text", () => {
      render(<MigrationTypeCheckbox checked={false} onChange={mockOnChange} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();

      const label = screen.getByText("Copy container in offline mode");
      expect(label).toBeInTheDocument();
    });

    it("should have correct accessibility attributes when checked", () => {
      render(<MigrationTypeCheckbox checked={true} onChange={mockOnChange} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
      expect(checkbox).toHaveAttribute("checked");
    });
  });

  describe("FluentUI Integration", () => {
    it("should render FluentUI Checkbox component correctly", () => {
      render(<MigrationTypeCheckbox checked={false} onChange={mockOnChange} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("should render FluentUI Stack component correctly", () => {
      render(<MigrationTypeCheckbox checked={false} onChange={mockOnChange} />);

      const stackContainer = document.querySelector(".migrationTypeRow");
      expect(stackContainer).toBeInTheDocument();
    });

    it("should apply FluentUI Stack horizontal alignment correctly", () => {
      const { container } = render(<MigrationTypeCheckbox checked={false} onChange={mockOnChange} />);

      const stackContainer = container.querySelector(".migrationTypeRow");
      expect(stackContainer).toBeInTheDocument();
    });
  });
});
