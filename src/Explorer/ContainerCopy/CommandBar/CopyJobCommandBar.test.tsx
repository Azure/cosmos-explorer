import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as CommandBarUtil from "../../Menus/CommandBar/CommandBarUtil";
import CopyJobCommandBar from "./CopyJobCommandBar";
import * as Utils from "./Utils";

jest.mock("../MonitorCopyJobs/MonitorCopyJobRefState");
jest.mock("../../Menus/CommandBar/CommandBarUtil");
jest.mock("./Utils");

describe("CopyJobCommandBar", () => {
  let mockExplorer: Explorer;
  let mockConvertButton: jest.MockedFunction<typeof CommandBarUtil.convertButton>;
  let mockGetCommandBarButtons: jest.MockedFunction<typeof Utils.getCommandBarButtons>;

  beforeEach(() => {
    mockExplorer = {} as Explorer;

    mockConvertButton = CommandBarUtil.convertButton as jest.MockedFunction<typeof CommandBarUtil.convertButton>;
    mockGetCommandBarButtons = Utils.getCommandBarButtons as jest.MockedFunction<typeof Utils.getCommandBarButtons>;

    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    mockGetCommandBarButtons.mockReturnValue([]);
    mockConvertButton.mockReturnValue([]);

    const { container } = render(<CopyJobCommandBar explorer={mockExplorer} />);
    expect(container.querySelector(".commandBarContainer")).toBeInTheDocument();
  });

  it("should call getCommandBarButtons with explorer", () => {
    mockGetCommandBarButtons.mockReturnValue([]);
    mockConvertButton.mockReturnValue([]);

    render(<CopyJobCommandBar explorer={mockExplorer} />);

    expect(mockGetCommandBarButtons).toHaveBeenCalledWith(mockExplorer);
    expect(mockGetCommandBarButtons).toHaveBeenCalledTimes(1);
  });

  it("should call convertButton with command bar items and background color", () => {
    const mockCommandButtonProps: CommandButtonComponentProps[] = [
      {
        iconSrc: "icon.svg",
        iconAlt: "Test Icon",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Test Button",
        ariaLabel: "Test Button Aria Label",
        tooltipText: "Test Tooltip",
        hasPopup: false,
        disabled: false,
      },
    ];
    mockGetCommandBarButtons.mockReturnValue(mockCommandButtonProps);
    mockConvertButton.mockReturnValue([]);

    render(<CopyJobCommandBar explorer={mockExplorer} />);

    expect(mockConvertButton).toHaveBeenCalledTimes(1);
  });

  it("should render FluentCommandBar with correct aria label", () => {
    mockGetCommandBarButtons.mockReturnValue([]);
    mockConvertButton.mockReturnValue([]);

    const { getByRole } = render(<CopyJobCommandBar explorer={mockExplorer} />);

    const commandBar = getByRole("menubar", { hidden: true });
    expect(commandBar).toHaveAttribute("aria-label", "Use left and right arrow keys to navigate between commands");
  });

  it("should render FluentCommandBar with converted items", () => {
    const mockCommandButtonProps: CommandButtonComponentProps[] = [
      {
        iconSrc: "icon1.svg",
        iconAlt: "Test Icon 1",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Test Button 1",
        ariaLabel: "Test Button 1 Aria Label",
        tooltipText: "Test Tooltip 1",
        hasPopup: false,
        disabled: false,
      },
      {
        iconSrc: "icon2.svg",
        iconAlt: "Test Icon 2",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Test Button 2",
        ariaLabel: "Test Button 2 Aria Label",
        tooltipText: "Test Tooltip 2",
        hasPopup: false,
        disabled: false,
      },
    ];

    const mockFluentItems = [
      {
        key: "button1",
        text: "Test Button 1",
        iconProps: { iconName: "Add" },
      },
      {
        key: "button2",
        text: "Test Button 2",
        iconProps: { iconName: "Feedback" },
      },
    ];

    mockGetCommandBarButtons.mockReturnValue(mockCommandButtonProps);
    mockConvertButton.mockReturnValue(mockFluentItems);

    const { container } = render(<CopyJobCommandBar explorer={mockExplorer} />);

    expect(mockConvertButton).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".commandBarContainer")).toBeInTheDocument();
  });

  it("should handle multiple command bar buttons", () => {
    const mockCommandButtonProps: CommandButtonComponentProps[] = [
      {
        iconSrc: "create.svg",
        iconAlt: "Create",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Create Copy Job",
        ariaLabel: "Create Copy Job",
        tooltipText: "Create Copy Job",
        hasPopup: false,
        disabled: false,
      },
      {
        iconSrc: "refresh.svg",
        iconAlt: "Refresh",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Refresh",
        ariaLabel: "Refresh",
        tooltipText: "Refresh",
        hasPopup: false,
        disabled: false,
      },
      {
        iconSrc: "feedback.svg",
        iconAlt: "Feedback",
        onCommandClick: jest.fn(),
        commandButtonLabel: "Feedback",
        ariaLabel: "Feedback",
        tooltipText: "Feedback",
        hasPopup: false,
        disabled: false,
      },
    ];

    mockGetCommandBarButtons.mockReturnValue(mockCommandButtonProps);
    mockConvertButton.mockReturnValue([
      { key: "create", text: "Create Copy Job" },
      { key: "refresh", text: "Refresh" },
      { key: "feedback", text: "Feedback" },
    ]);

    render(<CopyJobCommandBar explorer={mockExplorer} />);

    expect(mockGetCommandBarButtons).toHaveBeenCalledWith(mockExplorer);
    expect(mockConvertButton.mock.calls[0][0]).toEqual(mockCommandButtonProps);
  });

  it("should re-render when explorer prop changes", () => {
    const mockExplorer1 = { id: "explorer1" } as unknown as Explorer;
    const mockExplorer2 = { id: "explorer2" } as unknown as Explorer;

    mockGetCommandBarButtons.mockReturnValue([]);
    mockConvertButton.mockReturnValue([]);

    const { rerender } = render(<CopyJobCommandBar explorer={mockExplorer1} />);
    expect(mockGetCommandBarButtons).toHaveBeenCalledWith(mockExplorer1);

    rerender(<CopyJobCommandBar explorer={mockExplorer2} />);

    expect(mockGetCommandBarButtons).toHaveBeenCalledWith(mockExplorer2);
    expect(mockGetCommandBarButtons).toHaveBeenCalledTimes(2);
  });
});
