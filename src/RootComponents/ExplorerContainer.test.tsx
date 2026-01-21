import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Explorer from "../Explorer/Explorer";
import { useCarousel } from "../hooks/useCarousel";
import { useInteractive } from "../Metrics/useMetricPhases";
import ExplorerContainer from "./ExplorerContainer";

jest.mock("../Explorer/Controls/Dialog", () => ({
  Dialog: () => <div data-testid="mock-dialog">Dialog</div>,
}));

jest.mock("../Explorer/Menus/CommandBar/CommandBarComponentAdapter", () => ({
  CommandBar: ({ container }: { container: Explorer }) => (
    <div data-testid="mock-command-bar">CommandBar - {container ? "with explorer" : "no explorer"}</div>
  ),
}));

jest.mock("../Explorer/Menus/NotificationConsole/NotificationConsoleComponent", () => ({
  NotificationConsole: () => <div data-testid="mock-notification-console">NotificationConsole</div>,
}));

jest.mock("../Explorer/Panes/PanelContainerComponent", () => ({
  SidePanel: () => <div data-testid="mock-side-panel">SidePanel</div>,
}));

jest.mock("../Explorer/QueryCopilot/CopilotCarousel", () => ({
  QueryCopilotCarousel: ({ isOpen, explorer }: { isOpen: boolean; explorer: Explorer }) => (
    <div data-testid="mock-copilot-carousel">
      CopilotCarousel - {isOpen ? "open" : "closed"} - {explorer ? "with explorer" : "no explorer"}
    </div>
  ),
}));

jest.mock("../Explorer/Quickstart/QuickstartCarousel", () => ({
  QuickstartCarousel: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="mock-quickstart-carousel">QuickstartCarousel - {isOpen ? "open" : "closed"}</div>
  ),
}));

jest.mock("../Explorer/Quickstart/Tutorials/MongoQuickstartTutorial", () => ({
  MongoQuickstartTutorial: () => <div data-testid="mock-mongo-tutorial">MongoQuickstartTutorial</div>,
}));

jest.mock("../Explorer/Quickstart/Tutorials/SQLQuickstartTutorial", () => ({
  SQLQuickstartTutorial: () => <div data-testid="mock-sql-tutorial">SQLQuickstartTutorial</div>,
}));

jest.mock("../Explorer/Sidebar", () => ({
  SidebarContainer: ({ explorer }: { explorer: Explorer }) => (
    <div data-testid="mock-sidebar-container">SidebarContainer - {explorer ? "with explorer" : "no explorer"}</div>
  ),
}));

jest.mock("../hooks/useCarousel", () => ({
  useCarousel: jest.fn((selector) => {
    if (selector.toString().includes("shouldOpen")) {
      return true;
    }
    if (selector.toString().includes("showCopilotCarousel")) {
      return false;
    }
    return false;
  }),
}));

jest.mock("../Metrics/useMetricPhases", () => ({
  useInteractive: jest.fn(),
}));

jest.mock("../Metrics/MetricEvents", () => ({
  __esModule: true,
  default: {
    ApplicationLoad: "ApplicationLoad",
  },
}));

describe("ExplorerContainer", () => {
  let mockExplorer: Explorer;

  beforeEach(() => {
    mockExplorer = {
      id: "test-explorer",
      name: "Test Explorer",
    } as unknown as Explorer;

    jest.clearAllMocks();
  });

  test("should render explorer container with all components", () => {
    const { container } = render(<ExplorerContainer explorer={mockExplorer} />);

    const mainContainer = container.querySelector('[data-test="DataExplorerRoot"]');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass("flexContainer");

    expect(screen.getByTestId("mock-command-bar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sidebar-container")).toBeInTheDocument();
    expect(screen.getByTestId("mock-notification-console")).toBeInTheDocument();
    expect(screen.getByTestId("mock-side-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("mock-quickstart-carousel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sql-tutorial")).toBeInTheDocument();
    expect(screen.getByTestId("mock-mongo-tutorial")).toBeInTheDocument();
    expect(screen.getByTestId("mock-copilot-carousel")).toBeInTheDocument();
  });

  test("should pass explorer to components that need it", () => {
    render(<ExplorerContainer explorer={mockExplorer} />);

    expect(screen.getByText("CommandBar - with explorer")).toBeInTheDocument();
    expect(screen.getByText("SidebarContainer - with explorer")).toBeInTheDocument();
    expect(screen.getByText("CopilotCarousel - closed - with explorer")).toBeInTheDocument();
  });

  test("should have correct DOM structure", () => {
    const { container } = render(<ExplorerContainer explorer={mockExplorer} />);

    const mainContainer = container.querySelector('[data-test="DataExplorerRoot"]');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveAttribute("aria-hidden", "false");

    const divExplorer = container.querySelector("#divExplorer");
    expect(divExplorer).toBeInTheDocument();
    expect(divExplorer).toHaveClass("flexContainer", "hideOverflows");

    const freeTierBubble = container.querySelector("#freeTierTeachingBubble");
    expect(freeTierBubble).toBeInTheDocument();

    const notificationContainer = container.querySelector("#explorerNotificationConsole");
    expect(notificationContainer).toBeInTheDocument();
    expect(notificationContainer).toHaveClass("dataExplorerErrorConsoleContainer");
    expect(notificationContainer).toHaveAttribute("role", "contentinfo");
    expect(notificationContainer).toHaveAttribute("aria-label", "Notification console");
  });

  test("should apply correct inline styles", () => {
    const { container } = render(<ExplorerContainer explorer={mockExplorer} />);

    const mainContainer = container.querySelector('[data-test="DataExplorerRoot"]');
    expect(mainContainer).toHaveStyle({
      flex: "1",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
    });

    const divExplorer = container.querySelector("#divExplorer");
    expect(divExplorer).toHaveStyle({
      flex: "1",
      display: "flex",
      flexDirection: "column",
    });
  });

  test("should handle carousel states correctly", () => {
    const mockUseCarousel = jest.mocked(useCarousel);

    mockUseCarousel.mockImplementation((selector: { toString: () => string }) => {
      if (selector.toString().includes("shouldOpen")) {
        return false;
      }
      if (selector.toString().includes("showCopilotCarousel")) {
        return true;
      }
      return false;
    });

    render(<ExplorerContainer explorer={mockExplorer} />);

    expect(screen.getByText("QuickstartCarousel - closed")).toBeInTheDocument();
    expect(screen.getByText("CopilotCarousel - open - with explorer")).toBeInTheDocument();
  });

  test("should call useInteractive hook with correct metric", () => {
    const mockUseInteractive = jest.mocked(useInteractive);

    render(<ExplorerContainer explorer={mockExplorer} />);

    expect(mockUseInteractive).toHaveBeenCalledWith("ApplicationLoad");
  });
});
