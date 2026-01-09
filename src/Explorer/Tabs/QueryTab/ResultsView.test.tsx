import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { IndexAdvisorTab } from "Explorer/Tabs/QueryTab/ResultsView";
import React from "react";

const mockReplace = jest.fn();
const mockFetchAll = jest.fn();
const mockRead = jest.fn();
const mockLogConsoleProgress = jest.fn();
const mockHandleError = jest.fn();

const indexMetricsResponse = {
  UtilizedIndexes: {
    SingleIndexes: [{ IndexSpec: "/foo/?", IndexImpactScore: "High" }],
    CompositeIndexes: [{ IndexSpecs: ["/baz/? DESC", "/qux/? ASC"], IndexImpactScore: "Low" }],
  },
  PotentialIndexes: {
    SingleIndexes: [{ IndexSpec: "/bar/?", IndexImpactScore: "Medium" }],
    CompositeIndexes: [] as Array<{ IndexSpecs: string[]; IndexImpactScore?: string }>,
  },
};

const mockQueryResults = {
  documents: [] as unknown[],
  hasMoreResults: false,
  itemCount: 0,
  firstItemIndex: 0,
  lastItemIndex: 0,
  requestCharge: 0,
  activityId: "test-activity-id",
};

mockRead.mockResolvedValue({
  resource: {
    indexingPolicy: {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [{ path: "/*" }, { path: "/foo/?" }],
      excludedPaths: [],
    },
    partitionKey: "pk",
  },
});

mockReplace.mockResolvedValue({
  resource: {
    indexingPolicy: {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [{ path: "/*" }],
      excludedPaths: [],
    },
  },
});

jest.mock("Common/CosmosClient", () => ({
  client: () => ({
    database: () => ({
      container: () => ({
        items: {
          query: () => ({
            fetchAll: mockFetchAll,
          }),
        },
        read: mockRead,
        replace: mockReplace,
      }),
    }),
  }),
}));

jest.mock("./StylesAdvisor", () => ({
  useIndexAdvisorStyles: () => ({}),
}));

jest.mock("../../../Utils/NotificationConsoleUtils", () => ({
  logConsoleProgress: (...args: unknown[]) => {
    mockLogConsoleProgress(...args);
    return () => {};
  },
}));

jest.mock("../../../Common/ErrorHandlingUtils", () => ({
  handleError: (...args: unknown[]) => mockHandleError(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchAll.mockResolvedValue({ indexMetrics: indexMetricsResponse });
});

describe("IndexAdvisorTab Basic Tests", () => {
  test("component renders without crashing", () => {
    const { container } = render(
      <IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />,
    );
    expect(container).toBeTruthy();
  });

  test("renders component and handles missing parameters", () => {
    const { container } = render(<IndexAdvisorTab />);
    expect(container).toBeTruthy();
    // Should not crash when parameters are missing
  });

  test("fetches index metrics with query results", async () => {
    render(
      <IndexAdvisorTab
        queryResults={mockQueryResults}
        queryEditorContent="SELECT * FROM c"
        databaseId="db1"
        containerId="col1"
      />,
    );
    await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
  });

  test("displays content after loading", async () => {
    render(
      <IndexAdvisorTab
        queryResults={mockQueryResults}
        queryEditorContent="SELECT * FROM c"
        databaseId="db1"
        containerId="col1"
      />,
    );
    // Wait for the component to finish loading
    await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
    // Component should have rendered some content
    expect(screen.getByText(/Index Advisor/i)).toBeInTheDocument();
  });

  test("calls log console progress when fetching metrics", async () => {
    render(
      <IndexAdvisorTab
        queryResults={mockQueryResults}
        queryEditorContent="SELECT * FROM c"
        databaseId="db1"
        containerId="col1"
      />,
    );
    await waitFor(() => expect(mockLogConsoleProgress).toHaveBeenCalled());
  });

  test("handles error when fetch fails", async () => {
    mockFetchAll.mockRejectedValueOnce(new Error("fetch failed"));
    render(
      <IndexAdvisorTab
        queryResults={mockQueryResults}
        queryEditorContent="SELECT * FROM c"
        databaseId="db1"
        containerId="col1"
      />,
    );
    await waitFor(() => expect(mockHandleError).toHaveBeenCalled(), { timeout: 3000 });
  });

  test("renders with all required props", () => {
    const { container } = render(
      <IndexAdvisorTab
        queryResults={mockQueryResults}
        queryEditorContent="SELECT * FROM c"
        databaseId="testDb"
        containerId="testContainer"
      />,
    );
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeTruthy();
  });
});
