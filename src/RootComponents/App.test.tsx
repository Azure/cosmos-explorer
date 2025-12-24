import { loadTheme } from "@fluentui/react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { updateStyles } from "../Common/StyleConstants";
import { Platform } from "../ConfigContext";
import { useConfig } from "../hooks/useConfig";
import { useKnockoutExplorer } from "../hooks/useKnockoutExplorer";
import { MetricScenarioContextValue, useMetricScenario } from "../Metrics/MetricScenarioProvider";
import App from "./App";

const mockUserContext = {
  features: { enableContainerCopy: false },
  apiType: "SQL",
};

jest.mock("@fluentui/react", () => ({
  loadTheme: jest.fn(),
  makeStyles: jest.fn(() => () => ({
    root: "mock-app-root-class",
  })),
  MessageBarType: {
    error: "error",
    warning: "warning",
    info: "info",
    success: "success",
  },
  SpinnerSize: {
    xSmall: "xSmall",
    small: "small",
    medium: "medium",
    large: "large",
  },
}));

jest.mock("../Common/StyleConstants", () => ({
  StyleConstants: {
    BaseMedium: "#000000",
    AccentMediumHigh: "#0078d4",
    AccentMedium: "#106ebe",
    AccentLight: "#deecf9",
    AccentAccentExtra: "#0078d4",
    FabricAccentMediumHigh: "#0078d4",
    FabricAccentMedium: "#106ebe",
    FabricAccentLight: "#deecf9",
    PortalAccentMediumHigh: "#0078d4",
    PortalAccentMedium: "#106ebe",
    PortalAccentLight: "#deecf9",
  },
  updateStyles: jest.fn(),
}));

jest.mock("./LoadingExplorer", () => {
  const MockLoadingExplorer = () => {
    return <div data-testid="mock-loading-explorer">Loading Explorer</div>;
  };
  MockLoadingExplorer.displayName = "MockLoadingExplorer";
  return MockLoadingExplorer;
});

jest.mock("./ExplorerContainer", () => {
  const MockExplorerContainer = ({ explorer }: { explorer: unknown }) => {
    return (
      <div data-testid="mock-explorer-container">Explorer Container - {explorer ? "with explorer" : "no explorer"}</div>
    );
  };
  MockExplorerContainer.displayName = "MockExplorerContainer";
  return MockExplorerContainer;
});

jest.mock("../Explorer/ContainerCopy/ContainerCopyPanel", () => {
  const MockContainerCopyPanel = ({ explorer }: { explorer: unknown }) => {
    return (
      <div data-testid="mock-container-copy-panel">
        Container Copy Panel - {explorer ? "with explorer" : "no explorer"}
      </div>
    );
  };
  MockContainerCopyPanel.displayName = "MockContainerCopyPanel";
  return MockContainerCopyPanel;
});

jest.mock("../KeyboardShortcuts", () => ({
  KeyboardShortcutRoot: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-keyboard-shortcut-root">{children}</div>
  ),
}));

jest.mock("../UserContext", () => ({
  get userContext() {
    return mockUserContext;
  },
}));

const mockConfig = {
  platform: Platform.Portal,
};

const mockExplorer = {
  id: "test-explorer",
  name: "Test Explorer",
};

jest.mock("../hooks/useConfig", () => ({
  useConfig: jest.fn(() => mockConfig),
}));

jest.mock("../hooks/useKnockoutExplorer", () => ({
  useKnockoutExplorer: jest.fn(),
}));

jest.mock("../Metrics/MetricScenarioProvider", () => ({
  useMetricScenario: jest.fn(() => ({
    startScenario: jest.fn(),
    completePhase: jest.fn(),
  })),
}));

jest.mock("../Metrics/MetricEvents", () => ({
  __esModule: true,
  default: {
    ApplicationLoad: "ApplicationLoad",
  },
}));

jest.mock("../Metrics/ScenarioConfig", () => ({
  ApplicationMetricPhase: {
    ExplorerInitialized: "ExplorerInitialized",
  },
  CommonMetricPhase: {
    Interactive: "Interactive",
  },
}));

jest.mock("../Platform/Fabric/FabricTheme", () => ({
  appThemeFabric: { name: "fabric-theme" },
}));

describe("App", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockUserContext.features = { enableContainerCopy: false };
    mockUserContext.apiType = "SQL";
  });
  let mockStartScenario: jest.Mock;
  let mockCompletePhase: jest.Mock;
  let mockUseKnockoutExplorer: jest.Mock;
  let mockUseConfig: jest.Mock;
  let mockLoadTheme: jest.Mock;
  let mockUpdateStyles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStartScenario = jest.fn();
    mockCompletePhase = jest.fn();

    mockUseKnockoutExplorer = jest.mocked(useKnockoutExplorer);
    mockUseConfig = jest.mocked(useConfig);
    mockLoadTheme = jest.mocked(loadTheme);
    mockUpdateStyles = jest.mocked(updateStyles);

    const mockUseMetricScenario = jest.mocked(useMetricScenario);
    mockUseMetricScenario.mockReturnValue({
      startScenario: mockStartScenario,
      completePhase: mockCompletePhase,
    } as unknown as MetricScenarioContextValue);

    mockUseConfig.mockReturnValue(mockConfig);
    mockUseKnockoutExplorer.mockReturnValue(null);
  });

  test("should render loading explorer when explorer is not ready", () => {
    mockUseKnockoutExplorer.mockReturnValue(null);

    render(<App />);

    expect(screen.getByTestId("mock-loading-explorer")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-explorer-container")).not.toBeInTheDocument();
  });

  test("should render explorer container when explorer is ready", () => {
    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(screen.getByTestId("mock-explorer-container")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-loading-explorer")).not.toBeInTheDocument();
  });

  test("should start metric scenario on mount", () => {
    render(<App />);

    expect(mockStartScenario).toHaveBeenCalledWith("ApplicationLoad");
    expect(mockStartScenario).toHaveBeenCalledTimes(1);
  });

  test("should complete metric phase when explorer is initialized", async () => {
    const { rerender } = render(<App />);

    expect(mockCompletePhase).not.toHaveBeenCalled();

    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);
    rerender(<App />);

    await waitFor(() => {
      expect(mockCompletePhase).toHaveBeenCalledWith("ApplicationLoad", "ExplorerInitialized");
    });
  });

  test("should load fabric theme when platform is Fabric", () => {
    const fabricConfig = { platform: Platform.Fabric };
    mockUseConfig.mockReturnValue(fabricConfig);
    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(mockLoadTheme).toHaveBeenCalledWith({ name: "fabric-theme" });
  });

  test("should not load fabric theme when platform is not Fabric", () => {
    const portalConfig = { platform: Platform.Portal };
    mockUseConfig.mockReturnValue(portalConfig);

    render(<App />);

    expect(mockLoadTheme).not.toHaveBeenCalled();
  });

  test("should always call updateStyles", () => {
    render(<App />);

    expect(mockUpdateStyles).toHaveBeenCalled();
  });

  test("should render container copy panel when container copy is enabled and API is SQL", () => {
    mockUserContext.features = { enableContainerCopy: true };
    mockUserContext.apiType = "SQL";

    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(screen.getByTestId("mock-container-copy-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-explorer-container")).not.toBeInTheDocument();
  });

  test("should render explorer container when container copy is disabled", () => {
    mockUserContext.features = { enableContainerCopy: false };
    mockUserContext.apiType = "SQL";

    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(screen.getByTestId("mock-explorer-container")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-container-copy-panel")).not.toBeInTheDocument();
  });

  test("should render explorer container when API is not SQL", () => {
    mockUserContext.features = { enableContainerCopy: true };
    mockUserContext.apiType = "MongoDB";

    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(screen.getByTestId("mock-explorer-container")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-container-copy-panel")).not.toBeInTheDocument();
  });

  test("should have correct DOM structure", () => {
    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    const { container } = render(<App />);

    const mainDiv = container.querySelector("#Main");
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass("mock-app-root-class");

    expect(screen.getByTestId("mock-keyboard-shortcut-root")).toBeInTheDocument();

    const flexContainer = container.querySelector(".flexContainer");
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveAttribute("aria-hidden", "false");
  });

  test("should handle config changes for Fabric platform", () => {
    const { rerender } = render(<App />);

    const fabricConfig = { platform: Platform.Fabric };
    mockUseConfig.mockReturnValue(fabricConfig);

    rerender(<App />);

    expect(mockLoadTheme).toHaveBeenCalledWith({ name: "fabric-theme" });
  });

  test("should pass explorer to child components", () => {
    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    render(<App />);

    expect(screen.getByText("Explorer Container - with explorer")).toBeInTheDocument();
  });

  test("should handle null config gracefully", () => {
    mockUseConfig.mockReturnValue(null);
    mockUseKnockoutExplorer.mockReturnValue(mockExplorer);

    expect(() => render(<App />)).not.toThrow();

    expect(mockLoadTheme).not.toHaveBeenCalled();
    expect(mockUpdateStyles).toHaveBeenCalled();
  });
});
