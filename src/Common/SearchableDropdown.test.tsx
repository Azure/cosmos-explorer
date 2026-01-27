import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { SearchableDropdown } from "./SearchableDropdown";

interface TestItem {
  id: string;
  name: string;
}

describe("SearchableDropdown", () => {
  const mockItems: TestItem[] = [
    { id: "1", name: "Item One" },
    { id: "2", name: "Item Two" },
    { id: "3", name: "Item Three" },
  ];

  const defaultProps = {
    label: "Test Label",
    items: mockItems,
    selectedItem: null,
    onSelect: jest.fn(),
    getKey: (item: TestItem) => item.id,
    getDisplayText: (item: TestItem) => item.name,
    placeholder: "Select an item",
    filterPlaceholder: "Filter items",
    className: "test-dropdown",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with label and placeholder", () => {
    render(<SearchableDropdown {...defaultProps} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("Select an item")).toBeInTheDocument();
  });

  it("should display selected item", () => {
    const propsWithSelection = {
      ...defaultProps,
      selectedItem: mockItems[0],
    };
    render(<SearchableDropdown {...propsWithSelection} />);
    expect(screen.getByText("Item One")).toBeInTheDocument();
  });

  it("should show 'No items found' when items array is empty", () => {
    const propsWithEmptyItems = {
      ...defaultProps,
      items: [],
    };
    render(<SearchableDropdown {...propsWithEmptyItems} />);
    expect(screen.getByText("No Test Labels Found")).toBeInTheDocument();
  });

  it("should open dropdown when button is clicked", () => {
    render(<SearchableDropdown {...defaultProps} />);
    const button = screen.getByText("Select an item");
    fireEvent.click(button);
    expect(screen.getByPlaceholderText("Filter items")).toBeInTheDocument();
  });

  it("should filter items based on search text", () => {
    render(<SearchableDropdown {...defaultProps} />);
    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    const searchBox = screen.getByPlaceholderText("Filter items");
    fireEvent.change(searchBox, { target: { value: "Two" } });

    expect(screen.getByText("Item Two")).toBeInTheDocument();
    expect(screen.queryByText("Item One")).not.toBeInTheDocument();
    expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
  });

  it("should call onSelect when an item is clicked", () => {
    const onSelectMock = jest.fn();
    const propsWithMock = {
      ...defaultProps,
      onSelect: onSelectMock,
    };
    render(<SearchableDropdown {...propsWithMock} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    const item = screen.getByText("Item Two");
    fireEvent.click(item);

    expect(onSelectMock).toHaveBeenCalledWith(mockItems[1]);
  });

  it("should close dropdown after selecting an item", () => {
    render(<SearchableDropdown {...defaultProps} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    expect(screen.getByPlaceholderText("Filter items")).toBeInTheDocument();

    const item = screen.getByText("Item One");
    fireEvent.click(item);

    expect(screen.queryByPlaceholderText("Filter items")).not.toBeInTheDocument();
  });

  it("should disable button when disabled prop is true", () => {
    const propsWithDisabled = {
      ...defaultProps,
      disabled: true,
    };
    render(<SearchableDropdown {...propsWithDisabled} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should not open dropdown when disabled", () => {
    const propsWithDisabled = {
      ...defaultProps,
      disabled: true,
    };
    render(<SearchableDropdown {...propsWithDisabled} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.queryByPlaceholderText("Filter items")).not.toBeInTheDocument();
  });

  it("should show 'No items found' when search yields no results", () => {
    render(<SearchableDropdown {...defaultProps} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    const searchBox = screen.getByPlaceholderText("Filter items");
    fireEvent.change(searchBox, { target: { value: "Nonexistent" } });

    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("should handle case-insensitive filtering", () => {
    render(<SearchableDropdown {...defaultProps} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    const searchBox = screen.getByPlaceholderText("Filter items");
    fireEvent.change(searchBox, { target: { value: "two" } });

    expect(screen.getByText("Item Two")).toBeInTheDocument();
    expect(screen.queryByText("Item One")).not.toBeInTheDocument();
  });

  it("should clear filter text when dropdown is closed and reopened", () => {
    render(<SearchableDropdown {...defaultProps} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    const searchBox = screen.getByPlaceholderText("Filter items");
    fireEvent.change(searchBox, { target: { value: "Two" } });

    // Close dropdown by selecting an item
    const item = screen.getByText("Item Two");
    fireEvent.click(item);

    // Reopen dropdown
    fireEvent.click(button);

    // Filter text should be cleared
    const reopenedSearchBox = screen.getByPlaceholderText("Filter items");
    expect(reopenedSearchBox).toHaveValue("");
  });

  it("should use custom placeholder text", () => {
    const propsWithCustomPlaceholder = {
      ...defaultProps,
      placeholder: "Choose an option",
    };
    render(<SearchableDropdown {...propsWithCustomPlaceholder} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("should use custom filter placeholder text", () => {
    const propsWithCustomFilterPlaceholder = {
      ...defaultProps,
      filterPlaceholder: "Search here",
    };
    render(<SearchableDropdown {...propsWithCustomFilterPlaceholder} />);

    const button = screen.getByText("Select an item");
    fireEvent.click(button);

    expect(screen.getByPlaceholderText("Search here")).toBeInTheDocument();
  });
});
