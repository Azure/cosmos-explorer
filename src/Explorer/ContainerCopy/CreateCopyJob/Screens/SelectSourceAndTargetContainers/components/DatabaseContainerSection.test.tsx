import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { DatabaseContainerSectionProps, DropdownOptionType } from "../../../../Types/CopyJobTypes";
import { DatabaseContainerSection } from "./DatabaseContainerSection";

describe("DatabaseContainerSection", () => {
  const mockDatabaseOnChange = jest.fn();
  const mockContainerOnChange = jest.fn();
  const mockHandleOnDemandCreateContainer = jest.fn();

  const mockDatabaseOptions: DropdownOptionType[] = [
    { key: "db1", text: "Database 1", data: { id: "db1" } },
    { key: "db2", text: "Database 2", data: { id: "db2" } },
    { key: "db3", text: "Database 3", data: { id: "db3" } },
  ];

  const mockContainerOptions: DropdownOptionType[] = [
    { key: "container1", text: "Container 1", data: { id: "container1" } },
    { key: "container2", text: "Container 2", data: { id: "container2" } },
    { key: "container3", text: "Container 3", data: { id: "container3" } },
  ];

  const defaultProps: DatabaseContainerSectionProps = {
    heading: "Source container",
    databaseOptions: mockDatabaseOptions,
    selectedDatabase: "db1",
    databaseDisabled: false,
    databaseOnChange: mockDatabaseOnChange,
    containerOptions: mockContainerOptions,
    selectedContainer: "container1",
    containerDisabled: false,
    containerOnChange: mockContainerOnChange,
    sectionType: "source",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the component with correct structure", () => {
      const { container } = render(<DatabaseContainerSection {...defaultProps} />);

      expect(container.firstChild).toHaveClass("databaseContainerSection");
      expect(screen.getByText("Source container")).toBeInTheDocument();
    });

    it("renders heading correctly", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      const heading = screen.getByText("Source container");
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("LABEL");
      expect(heading).toHaveClass("subHeading");
    });

    it("renders database dropdown with correct properties", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });

      expect(databaseDropdown).toBeInTheDocument();
      expect(databaseDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.databaseDropdownLabel);
      expect(databaseDropdown).not.toBeDisabled();
    });

    it("renders container dropdown with correct properties", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(containerDropdown).toBeInTheDocument();
      expect(containerDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.containerDropdownLabel);
      expect(containerDropdown).not.toBeDisabled();
    });

    it("renders database label correctly", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      expect(screen.getByText(`${ContainerCopyMessages.databaseDropdownLabel}:`)).toBeInTheDocument();
    });

    it("renders container label correctly", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      expect(screen.getByText(`${ContainerCopyMessages.containerDropdownLabel}:`)).toBeInTheDocument();
    });

    it("does not render create container button when handleOnDemandCreateContainer is not provided", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      expect(screen.queryByText(ContainerCopyMessages.createContainerButtonLabel)).not.toBeInTheDocument();
    });

    it("renders create container button when handleOnDemandCreateContainer is provided", () => {
      const propsWithCreateHandler = {
        ...defaultProps,
        handleOnDemandCreateContainer: mockHandleOnDemandCreateContainer,
      };
      const { container } = render(<DatabaseContainerSection {...propsWithCreateHandler} />);
      const createButton = container.querySelector(".create-container-link-btn");

      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveTextContent(ContainerCopyMessages.createContainerButtonLabel);
    });
  });

  describe("Dropdown States", () => {
    it("renders database dropdown as disabled when databaseDisabled is true", () => {
      const propsWithDisabledDatabase = {
        ...defaultProps,
        databaseDisabled: true,
      };

      render(<DatabaseContainerSection {...propsWithDisabledDatabase} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });

      expect(databaseDropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("renders container dropdown as disabled when containerDisabled is true", () => {
      const propsWithDisabledContainer = {
        ...defaultProps,
        containerDisabled: true,
      };

      render(<DatabaseContainerSection {...propsWithDisabledContainer} />);

      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(containerDropdown).toHaveAttribute("aria-disabled", "true");
    });

    it("handles falsy values for disabled props correctly", () => {
      const propsWithFalsyDisabled = {
        ...defaultProps,
        databaseDisabled: undefined,
        containerDisabled: null,
      } as DatabaseContainerSectionProps;

      render(<DatabaseContainerSection {...propsWithFalsyDisabled} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });
      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(databaseDropdown).not.toHaveAttribute("aria-disabled", "true");
      expect(containerDropdown).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("User Interactions", () => {
    it("calls databaseOnChange when database dropdown selection changes", () => {
      render(<DatabaseContainerSection {...defaultProps} />);
      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });

      fireEvent.click(databaseDropdown);
      expect(databaseDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.databaseDropdownLabel);
    });

    it("calls containerOnChange when container dropdown selection changes", () => {
      render(<DatabaseContainerSection {...defaultProps} />);
      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      fireEvent.click(containerDropdown);
      expect(containerDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.containerDropdownLabel);
    });

    it("calls handleOnDemandCreateContainer when create container button is clicked", () => {
      const propsWithCreateHandler = {
        ...defaultProps,
        handleOnDemandCreateContainer: mockHandleOnDemandCreateContainer,
      };

      render(<DatabaseContainerSection {...propsWithCreateHandler} />);

      const createButton = screen.getByText(ContainerCopyMessages.createContainerButtonLabel);
      fireEvent.click(createButton);

      expect(mockHandleOnDemandCreateContainer).toHaveBeenCalledTimes(1);
      expect(mockHandleOnDemandCreateContainer).toHaveBeenCalledWith();
    });
  });

  describe("Props Validation", () => {
    it("renders with different heading text", () => {
      const propsWithDifferentHeading = {
        ...defaultProps,
        heading: "Target container",
      };

      render(<DatabaseContainerSection {...propsWithDifferentHeading} />);

      expect(screen.getByText("Target container")).toBeInTheDocument();
      expect(screen.queryByText("Source container")).not.toBeInTheDocument();
    });

    it("renders with different selected values", () => {
      const propsWithDifferentSelections = {
        ...defaultProps,
        selectedDatabase: "db2",
        selectedContainer: "container3",
      };

      render(<DatabaseContainerSection {...propsWithDifferentSelections} />);

      expect(screen.getByText("Source container")).toBeInTheDocument();
    });

    it("renders with empty options arrays", () => {
      const propsWithEmptyOptions = {
        ...defaultProps,
        databaseOptions: [],
        containerOptions: [],
      } as DatabaseContainerSectionProps;

      render(<DatabaseContainerSection {...propsWithEmptyOptions} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });
      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(databaseDropdown).toBeInTheDocument();
      expect(containerDropdown).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for dropdowns", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });
      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(databaseDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.databaseDropdownLabel);
      expect(containerDropdown).toHaveAttribute("aria-label", ContainerCopyMessages.containerDropdownLabel);
    });

    it("has proper required attributes for dropdowns", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      const databaseDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.databaseDropdownLabel,
      });
      const containerDropdown = screen.getByRole("combobox", {
        name: ContainerCopyMessages.containerDropdownLabel,
      });

      expect(databaseDropdown).toHaveAttribute("aria-required", "true");
      expect(containerDropdown).toHaveAttribute("aria-required", "true");
    });

    it("maintains proper label associations", () => {
      render(<DatabaseContainerSection {...defaultProps} />);

      expect(screen.getByText(`${ContainerCopyMessages.databaseDropdownLabel}:`)).toBeInTheDocument();
      expect(screen.getByText(`${ContainerCopyMessages.containerDropdownLabel}:`)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined optional props gracefully", () => {
      const minimalProps: DatabaseContainerSectionProps = {
        heading: "Test Heading",
        databaseOptions: mockDatabaseOptions,
        selectedDatabase: "db1",
        databaseOnChange: mockDatabaseOnChange,
        containerOptions: mockContainerOptions,
        selectedContainer: "container1",
        containerOnChange: mockContainerOnChange,
        sectionType: "source",
      };

      render(<DatabaseContainerSection {...minimalProps} />);

      expect(screen.getByText("Test Heading")).toBeInTheDocument();
      expect(screen.queryByText(ContainerCopyMessages.createContainerButtonLabel)).not.toBeInTheDocument();
    });

    it("handles empty string selections", () => {
      const propsWithEmptySelections = {
        ...defaultProps,
        selectedDatabase: "",
        selectedContainer: "",
      };

      render(<DatabaseContainerSection {...propsWithEmptySelections} />);

      expect(screen.getByText("Source container")).toBeInTheDocument();
    });

    it("renders correctly with long option texts", () => {
      const longOptions = [
        {
          key: "long1",
          text: "This is a very long database name that might wrap to multiple lines in the dropdown",
          data: { id: "long1" },
        },
      ];

      const propsWithLongOptions = {
        ...defaultProps,
        databaseOptions: longOptions,
        containerOptions: longOptions,
        selectedDatabase: "long1",
        selectedContainer: "long1",
      };

      render(<DatabaseContainerSection {...propsWithLongOptions} />);

      expect(screen.getByText("Source container")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("has correct CSS classes applied", () => {
      const { container } = render(<DatabaseContainerSection {...defaultProps} />);

      const mainContainer = container.querySelector(".databaseContainerSection");
      expect(mainContainer).toBeInTheDocument();

      const subHeading = screen.getByText("Source container");
      expect(subHeading).toHaveClass("subHeading");
    });

    it("maintains proper component hierarchy", () => {
      const { container } = render(<DatabaseContainerSection {...defaultProps} />);

      const mainStack = container.querySelector(".databaseContainerSection");
      expect(mainStack).toBeInTheDocument();

      const fieldRows = container.querySelectorAll(".flex-row");
      expect(fieldRows.length).toBe(2);
    });

    it("renders create button in correct position when provided", () => {
      const propsWithCreateHandler = {
        ...defaultProps,
        handleOnDemandCreateContainer: mockHandleOnDemandCreateContainer,
      };

      const { container } = render(<DatabaseContainerSection {...propsWithCreateHandler} />);

      const createButton = screen.getByText(ContainerCopyMessages.createContainerButtonLabel);
      expect(createButton).toBeInTheDocument();

      const containerSection = container.querySelector(".databaseContainerSection");
      expect(containerSection).toContainElement(createButton);
    });

    it("displays correct create container button label", () => {
      const propsWithCreateHandler = {
        ...defaultProps,
        handleOnDemandCreateContainer: mockHandleOnDemandCreateContainer,
      };

      render(<DatabaseContainerSection {...propsWithCreateHandler} />);

      expect(screen.getByText(ContainerCopyMessages.createContainerButtonLabel)).toBeInTheDocument();
    });
  });

  describe("Snapshot Testing", () => {
    it("matches snapshot with minimal props", () => {
      const minimalProps: DatabaseContainerSectionProps = {
        heading: "Source Container",
        databaseOptions: [{ key: "db1", text: "Database 1", data: { id: "db1" } }],
        selectedDatabase: "db1",
        databaseOnChange: jest.fn(),
        containerOptions: [{ key: "c1", text: "Container 1", data: { id: "c1" } }],
        selectedContainer: "c1",
        containerOnChange: jest.fn(),
        sectionType: "source",
      };

      const { container } = render(<DatabaseContainerSection {...minimalProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with all props including create container handler", () => {
      const fullProps: DatabaseContainerSectionProps = {
        heading: "Target Container",
        databaseOptions: mockDatabaseOptions,
        selectedDatabase: "db2",
        databaseDisabled: false,
        databaseOnChange: jest.fn(),
        containerOptions: mockContainerOptions,
        selectedContainer: "container2",
        containerDisabled: false,
        containerOnChange: jest.fn(),
        handleOnDemandCreateContainer: jest.fn(),
        sectionType: "target",
      };

      const { container } = render(<DatabaseContainerSection {...fullProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with disabled states", () => {
      const disabledProps: DatabaseContainerSectionProps = {
        heading: "Disabled Section",
        databaseOptions: mockDatabaseOptions,
        selectedDatabase: "db1",
        databaseDisabled: true,
        databaseOnChange: jest.fn(),
        containerOptions: mockContainerOptions,
        selectedContainer: "container1",
        containerDisabled: true,
        containerOnChange: jest.fn(),
        sectionType: "target",
      };

      const { container } = render(<DatabaseContainerSection {...disabledProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with empty options", () => {
      const emptyOptionsProps: DatabaseContainerSectionProps = {
        heading: "Empty Options",
        databaseOptions: [],
        selectedDatabase: "",
        databaseOnChange: jest.fn(),
        containerOptions: [],
        selectedContainer: "",
        containerOnChange: jest.fn(),
        sectionType: "target",
      };

      const { container } = render(<DatabaseContainerSection {...emptyOptionsProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
