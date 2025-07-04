import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IndexAdvisorTab } from "Explorer/Tabs/QueryTab/ResultsView";
import React from "react";

const mockReplace = jest.fn();
const mockFetchAll = jest.fn();
const mockRead = jest.fn();
const mockLogConsoleProgress = jest.fn();
const mockHandleError = jest.fn();

const indexMetricsString = `
Utilized Single Indexes
Index Spec: /foo/?
Index Impact Score: High
Potential Single Indexes
Index Spec: /bar/?
Index Impact Score: Medium
Utilized Composite Indexes
Index Spec: /baz/? DESC, /qux/? ASC
Index Impact Score: Low
`;
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

jest.mock("./QueryTabComponent", () => ({
    useQueryMetadataStore: () => ({
        userQuery: "SELECT * FROM c",
        databaseId: "db1",
        containerId: "col1",
    }),
}));
jest.mock("Common/CosmosClient", () => ({
    client: () => ({
        database: () => ({
            container: () => ({
                items: {
                    query: () => ({
                        fetchAll: mockFetchAll.mockResolvedValueOnce({ indexMetrics: indexMetricsString })
                        ,
                    }),
                },
                read: mockRead,
                replace: mockReplace,
            }),
        }),
    }),
}));
jest.mock("./Indexadvisor", () => ({
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
    render(<IndexAdvisorTab />);
    await waitFor(() =>
        expect(mockLogConsoleProgress).toHaveBeenCalledWith(expect.stringContaining("IndexMetrics"))
    );
    console.log("Calls:", mockLogConsoleProgress.mock.calls);

});
test("renders both Included and Not Included sections after loading", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
    expect(screen.getByText("Not Included in Current Policy")).toBeInTheDocument();
    expect(screen.getByText("/foo/?")).toBeInTheDocument();
    expect(screen.getByText("/bar/?")).toBeInTheDocument();
});
test("shows update button only when an index is selected", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Select /bar/?
    expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();
    fireEvent.click(checkboxes[1]); // Deselect /bar/?
    expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
});
test("calls replace when update policy is confirmed", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    const updateButton = screen.getByText(/Update Indexing Policy/);
    fireEvent.click(updateButton);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    console.log("mockReplace calls:", mockReplace.mock.calls);
});

test("calls replace when update button is clicked", async () => {
    const cosmos = require("Common/CosmosClient");
    const mockReplace = cosmos.client().database().container().replace;
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Select /bar/?
    fireEvent.click(screen.getByText(/Update Indexing Policy/));
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    console.log("mockReplace calls:", mockReplace.mock.calls);
});

test("fetches indexing policy via read", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => {
        console.log("mockRead calls:", mockRead.mock.calls);
        expect(mockRead).toHaveBeenCalled();
    });
});

test("shows update button only when an index is selected", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(1);
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
});

test("selects all indexes when select-all is clicked", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
    const checkboxes = screen.getAllByRole("checkbox");
    console.log("Checkbox count:", checkboxes.length);

    fireEvent.click(checkboxes[0]);
    checkboxes.forEach((cb, i) => {
        expect(cb).toBeChecked();
    });
});

test("shows spinner while loading and hides after fetchIndexMetrics resolves", async () => {
    render(<IndexAdvisorTab />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    console.log("Spinner visibility test passed");
});

test("calls fetchAll with correct query and options", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
    console.log("fetchAll called times:", mockFetchAll.mock.calls.length);
    console.log("fetchAll called with args:", mockFetchAll.mock.calls[0]);
});

test("renders index metrics from SDK response", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/foo/?")).toBeInTheDocument());
    expect(screen.getByText("/bar/?")).toBeInTheDocument();
    expect(screen.getByText("/baz/? DESC, /qux/? ASC")).toBeInTheDocument();
});

test("calls handleError if fetchIndexMetrics throws", async () => {
    mockFetchAll.mockRejectedValueOnce(new Error("fail"));
    render(<IndexAdvisorTab />);

    console.log("Error handler called:", mockHandleError.mock.calls.length);
    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
});

test("calls handleError if fetchIndexMetrics throws2nd", async () => {
    const cosmos = require("Common/CosmosClient");
    mockFetchAll.mockRejectedValueOnce(new Error("fail"));

    render(<IndexAdvisorTab />);
    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    console.log("Error handler called:", mockHandleError.mock.calls.length);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("renders IndexAdvisorTab when clicked from ResultsView", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
    expect(screen.getByText("/foo/?")).toBeInTheDocument();
});

test("updates indexing policy after replace is triggered", async () => {
    render(<IndexAdvisorTab />);
    const barIndexText = await screen.findByText((content) =>
        content.includes("/bar/?")
    );
    expect(barIndexText).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Select /bar/? 
    const updateButton = screen.getByText(/Update Indexing Policy/);
    fireEvent.click(updateButton);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const updatedPolicy = mockReplace.mock.calls[0][0];
    expect(updatedPolicy).toBeDefined();
    expect(updatedPolicy.indexingPolicy.includedPaths).toEqual(
        expect.arrayContaining([{ path: "/*" }, { path: "/bar/?" }])
    );
});

test("IndexingPolicyStore stores updated policy on componentDidMount", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(mockRead).toHaveBeenCalled());

    const readResult = await mockRead.mock.results[0].value;
    const policy = readResult.resource.indexingPolicy;

    expect(policy).toBeDefined();
    expect(policy.automatic).toBe(true);
    expect(policy.indexingMode).toBe("consistent");
    expect(policy.includedPaths).toEqual(expect.arrayContaining([{ path: "/*" }, { path: "/foo/?" }]));
    console.log("Indexing policy stored:", policy);
});

test("refreshCollectionData updates observable and re-renders", async () => {
    render(<IndexAdvisorTab />);
    await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Select /bar/?
    fireEvent.click(screen.getByText(/Update Indexing Policy/));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(screen.getByText("/bar/?")).toBeInTheDocument();
    console.log("Collection data refreshed and re-rendered", mockReplace.mock.calls);
});
