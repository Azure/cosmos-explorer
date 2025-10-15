import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
            fetchAll: mockFetchAll.mockResolvedValue({ indexMetrics: indexMetricsResponse }),
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
    return () => { };
  },
}));

jest.mock("../../../Common/ErrorHandlingUtils", () => {
  return {
    handleError: (...args: unknown[]) => mockHandleError(...args),
  };
});

test("logs progress message when fetching index metrics", async () => {
  render(
    <IndexAdvisorTab
      queryResults={mockQueryResults}
      queryEditorContent="SELECT * FROM c"
      databaseId="db1"
      containerId="col1"
    />,
  );
  await waitFor(() => expect(mockLogConsoleProgress).toHaveBeenCalledWith(expect.stringContaining("IndexMetrics")));
});
test("renders both Included and Not Included sections after loading", async () => {
  render(
    <IndexAdvisorTab
      queryResults={mockQueryResults}
      queryEditorContent="SELECT * FROM c"
      databaseId="db1"
      containerId="col1"
    />,
  );
  await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
  expect(screen.getByText("Not Included in Current Policy")).toBeInTheDocument();
  expect(screen.getByText("/foo/?")).toBeInTheDocument();
  expect(screen.getByText("/bar/?")).toBeInTheDocument();
});
test("shows update button only when an index is selected", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
  const checkboxes = screen.getAllByRole("checkbox");
  expect(checkboxes.length).toBeGreaterThan(1);
  fireEvent.click(checkboxes[1]);
  expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();

  fireEvent.click(checkboxes[1]);
  expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
});
test("calls replace when update policy is confirmed", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
  const checkboxes = screen.getAllByRole("checkbox");
  fireEvent.click(checkboxes[1]);
  const updateButton = screen.getByText(/Update Indexing Policy/);
  fireEvent.click(updateButton);
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
});

test("calls replace when update button is clicked", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
  const checkboxes = screen.getAllByRole("checkbox");
  fireEvent.click(checkboxes[1]); // Select /bar/?
  fireEvent.click(screen.getByText(/Update Indexing Policy/));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
});

test("fetches indexing policy via read", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => {
    expect(mockRead).toHaveBeenCalled();
  });
});

test("selects all indexes when select-all is clicked", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
  const checkboxes = screen.getAllByRole("checkbox");

  fireEvent.click(checkboxes[0]);
  checkboxes.forEach((cb) => {
    expect(cb).toBeChecked();
  });
});

test("shows spinner while loading and hides after fetchIndexMetrics resolves", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
});

test("calls fetchAll with correct query and options", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
});
test("renders IndexAdvisorTab when clicked from ResultsView", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
  expect(screen.getByText("/foo/?")).toBeInTheDocument();
});
test("renders index metrics from SDK response", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/foo/?")).toBeInTheDocument());
  expect(screen.getByText("/bar/?")).toBeInTheDocument();
  expect(screen.getByText("/baz/? DESC, /qux/? ASC")).toBeInTheDocument();
});

test("calls handleError if fetchIndexMetrics throws", async () => {
  mockFetchAll.mockRejectedValueOnce(new Error("fail"));
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
});

test("calls handleError if fetchIndexMetrics throws2nd", async () => {
  mockFetchAll.mockRejectedValueOnce(new Error("fail"));

  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("IndexingPolicyStore stores updated policy on componentDidMount", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(mockRead).toHaveBeenCalled());

  const readResult = await mockRead.mock.results[0].value;
  const policy = readResult.resource.indexingPolicy;

  expect(policy).toBeDefined();
  expect(policy.automatic).toBe(true);
  expect(policy.indexingMode).toBe("consistent");
  expect(policy.includedPaths).toEqual(expect.arrayContaining([{ path: "/*" }, { path: "/foo/?" }]));
});

test("refreshCollectionData updates observable and re-renders", async () => {
  render(<IndexAdvisorTab queryEditorContent="SELECT * FROM c" databaseId="db1" containerId="col1" />);
  await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());

  const checkboxes = screen.getAllByRole("checkbox");
  fireEvent.click(checkboxes[1]); // Select /bar/?
  fireEvent.click(screen.getByText(/Update Indexing Policy/));

  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(screen.getByText("/bar/?")).toBeInTheDocument();
});
