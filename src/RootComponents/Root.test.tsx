import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Root from "./Root";

jest.mock("../Explorer/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-error-boundary">{children}</div>
  ),
}));

jest.mock("@fluentui/react-components", () => ({
  FluentProvider: ({ children, theme }: { children: React.ReactNode; theme: { colorNeutralBackground1: string } }) => (
    <div
      data-testid="mock-fluent-provider"
      data-theme={theme.colorNeutralBackground1 === "dark" ? "webDarkTheme" : "webLightTheme"}
    >
      {children}
    </div>
  ),
  webLightTheme: { colorNeutralBackground1: "light" },
  webDarkTheme: { colorNeutralBackground1: "dark" },
}));

jest.mock("./App", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-app">App</div>,
}));

const createMockStore = (isDarkMode: boolean = false) => ({
  getState: jest.fn(() => ({ isDarkMode })),
  subscribe: jest.fn(() => jest.fn()),
});

const mockThemeStore = createMockStore(false);

jest.mock("../hooks/useTheme", () => ({
  get useThemeStore() {
    return mockThemeStore;
  },
}));

describe("Root", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render Root component with all child components", () => {
    render(<Root />);

    expect(screen.getByTestId("mock-error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("mock-fluent-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-app")).toBeInTheDocument();
  });

  test("should have correct component hierarchy", () => {
    render(<Root />);

    const errorBoundary = screen.getByTestId("mock-error-boundary");
    const fluentProvider = screen.getByTestId("mock-fluent-provider");
    const app = screen.getByTestId("mock-app");

    expect(errorBoundary).toContainElement(fluentProvider);
    expect(fluentProvider).toContainElement(app);
  });

  test("should subscribe to theme changes on mount", () => {
    render(<Root />);

    expect(mockThemeStore.subscribe).toHaveBeenCalled();
    expect(mockThemeStore.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  test("should get initial theme state", () => {
    render(<Root />);

    expect(mockThemeStore.getState).toHaveBeenCalled();
  });

  test("should handle component unmounting", () => {
    const mockUnsubscribe = jest.fn();
    mockThemeStore.subscribe.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<Root />);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test("should render without errors", () => {
    expect(() => render(<Root />)).not.toThrow();
  });
});
