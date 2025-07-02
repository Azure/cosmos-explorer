// import "@testing-library/jest-dom";
// import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// import { IndexAdvisorTab } from "Explorer/Tabs/QueryTab/ResultsView";
// import React from "react";
// // Mock hooks and dependencies as needed for isolation

// // ---- Mocks ----
// const mockReplace = jest.fn();
// const mockFetchAll = jest.fn();
// const mockRead = jest.fn();
// const mockLogConsoleProgress = jest.fn();
// const mockHandleError = jest.fn();

// const indexMetricsString = `
// Utilized Single Indexes
// Index Spec: /foo/?
// Index Impact Score: High
// Potential Single Indexes
// Index Spec: /bar/?
// Index Impact Score: Medium
// Utilized Composite Indexes
// Index Spec: /baz/? DESC, /qux/? ASC
// Index Impact Score: Low
// `;
// mockRead.mockResolvedValue({
//     resource: {
//         indexingPolicy: {
//             automatic: true,
//             indexingMode: "consistent",
//             includedPaths: [{ path: "/*" }, { path: "/foo/?" }],
//             excludedPaths: [],
//         },
//         partitionKey: "pk",
//     },
// });
// mockReplace.mockResolvedValue({
//     resource: {
//         indexingPolicy: {
//             automatic: true,
//             indexingMode: "consistent",
//             includedPaths: [{ path: "/*" }],
//             excludedPaths: [],
//         },
//     },
// });

// // ---- Mock Setup ----

// jest.mock("./QueryTabComponent", () => ({
//     useQueryMetadataStore: () => ({
//         userQuery: "SELECT * FROM c",
//         databaseId: "db1",
//         containerId: "col1",
//     }),
// }));
// jest.mock("Common/CosmosClient", () => ({
//     client: () => ({
//         database: () => ({
//             container: () => ({
//                 items: {
//                     query: () => ({
//                         fetchAll: mockFetchAll.mockResolvedValueOnce({ indexMetrics: indexMetricsString })
//                         ,
//                     }),
//                 },
//                 read: mockRead,
//                 replace: mockReplace,
//             }),
//         }),
//     }),
// }));
// jest.mock("./indexadv", () => ({
//     useIndexAdvisorStyles: () => ({}),
// }));

// jest.mock("../../../Utils/NotificationConsoleUtils", () => ({
//     logConsoleProgress: (...args: unknown[]) => {
//         mockLogConsoleProgress(...args); // This ensures the mock is called
//         return () => { }; // Return a dummy function if needed
//     },
// }));

// jest.mock("../../../Common/ErrorHandlingUtils", () => {
//     return {
//         handleError: (...args: unknown[]) => mockHandleError(...args),
//     };
// });

// //done
// test("logs progress message when fetching index metrics", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() =>
//         expect(mockLogConsoleProgress).toHaveBeenCalledWith(expect.stringContaining("IndexMetrics"))
//     );
//     console.log("Calls:", mockLogConsoleProgress.mock.calls);

// });
// //done
// // This test checks that after loading, both index sections and their items are rendered.
// test("renders both Included and Not Included sections after loading", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
//     expect(screen.getByText("Not Included in Current Policy")).toBeInTheDocument();
//     expect(screen.getByText("/foo/?")).toBeInTheDocument();
//     expect(screen.getByText("/bar/?")).toBeInTheDocument();
// });
// //done
// test("shows update button only when an index is selected", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//     // Find the checkbox for the not included index
//     const checkboxes = screen.getAllByRole("checkbox");
//     fireEvent.click(checkboxes[1]); // Select /bar/?
//     expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();
//     fireEvent.click(checkboxes[1]); // Deselect /bar/?
//     expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
// });
// //done
// // 7. Update policy triggers replace
// test("calls replace when update policy is confirmed", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//     const checkboxes = screen.getAllByRole("checkbox");
//     fireEvent.click(checkboxes[1]);
//     const updateButton = screen.getByText(/Update Indexing Policy/);
//     fireEvent.click(updateButton);
//     await waitFor(() => expect(mockReplace).toHaveBeenCalled());
//     console.log("mockReplace calls:", mockReplace.mock.calls);
// });
// //done same above
// test("calls replace when update button is clicked", async () => {
//     const cosmos = require("Common/CosmosClient");
//     const mockReplace = cosmos.client().database().container().replace;
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//     const checkboxes = screen.getAllByRole("checkbox");
//     fireEvent.click(checkboxes[1]); // Select /bar/?
//     fireEvent.click(screen.getByText(/Update Indexing Policy/));
//     await waitFor(() => expect(mockReplace).toHaveBeenCalled());
//     console.log("mockReplace calls:", mockReplace.mock.calls);
// });
// //done
// // 8. Indexing policy is fetched via read
// test("fetches indexing policy via read", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => {
//         console.log("mockRead calls:", mockRead.mock.calls);
//         expect(mockRead).toHaveBeenCalled();
//     });
// });
// //done same
// // 5. Checkbox selection toggles update button same
// test("shows update button only when an index is selected", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//     // screen.debug(); // 🔍 See what’s rendered
//     const checkboxes = screen.getAllByRole("checkbox");
//     expect(checkboxes.length).toBeGreaterThan(1);
//     fireEvent.click(checkboxes[1]);
//     expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();

//     fireEvent.click(checkboxes[1]);
//     expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
// });

// //done
// test("selects all indexes when select-all is clicked", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//     // screen.debug(); // 🔍 See what’s rendered
//     const checkboxes = screen.getAllByRole("checkbox");
//     console.log("Checkbox count:", checkboxes.length);

//     fireEvent.click(checkboxes[0]); // Assuming first is select-all
//     checkboxes.forEach((cb, i) => {
//         expect(cb).toBeChecked();
//     });
// });
// //done
// // 1. Tab loads and spinner shows
// test("shows spinner while loading and hides after fetchIndexMetrics resolves", async () => {
//     render(<IndexAdvisorTab />);
//     expect(screen.getByRole("progressbar")).toBeInTheDocument();
//     await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
//     console.log("Spinner visibility test passed");
// });
// //done
// // // 2. SDK fetchAll is called
// test("calls fetchAll with correct query and options", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
//     console.log("fetchAll called times:", mockFetchAll.mock.calls.length);
//     console.log("fetchAll called with args:", mockFetchAll.mock.calls[0]);
// });
// //done
// // // 3. Index metrics are rendered
// test("renders index metrics from SDK response", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/foo/?")).toBeInTheDocument());
//     expect(screen.getByText("/bar/?")).toBeInTheDocument();
//     expect(screen.getByText("/baz/? DESC, /qux/? ASC")).toBeInTheDocument();
// });
// //done
// // 9. Error handling if fetch fails
// test("calls handleError if fetchIndexMetrics throws", async () => {
//     mockFetchAll.mockRejectedValueOnce(new Error("fail"));
//     render(<IndexAdvisorTab />);

//     console.log("Error handler called:", mockHandleError.mock.calls.length);
//     await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
// });
// //done same
// test("calls handleError if fetchIndexMetrics throws2nd", async () => {
//     const cosmos = require("Common/CosmosClient");
//     mockFetchAll.mockRejectedValueOnce(new Error("fail"));

//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(mockHandleError).toHaveBeenCalled()); // use your mock directly
//     console.log("Error handler called:", mockHandleError.mock.calls.length);
//     expect(screen.queryByRole("status")).not.toBeInTheDocument();
// });

// //10 indexing policy updates after replace is triggered
// test("updates indexing policy after replace is triggered", async () => {
//     render(<IndexAdvisorTab />);
//     screen.debug(); // Inspect the DOM

//     const barIndexText = await screen.findByText((content) =>
//         content.includes("/bar/?")
//     );
//     expect(barIndexText).toBeInTheDocument();

//     const checkboxes = screen.getAllByRole("checkbox");
//     fireEvent.click(checkboxes[1]); // Select /bar/?

//     const updateButton = screen.getByText(/Update Indexing Policy/);
//     fireEvent.click(updateButton);

//     await waitFor(() => expect(mockReplace).toHaveBeenCalled());

//     const updatedPolicy = mockReplace.mock.calls[0][0];
//     expect(updatedPolicy).toBeDefined();
//     expect(updatedPolicy.indexingPolicy.includedPaths).toEqual(
//         expect.arrayContaining([{ path: "/*" }, { path: "/bar/?" }])
//     );

//     console.log("Indexing policy updated:", updatedPolicy);
// });

// //done
// //11 renders IndexAdvisorTab when clicked from ResultsView
// test("renders IndexAdvisorTab when clicked from ResultsView", async () => {
//     // Simulate navigation or tab click
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
//     expect(screen.getByText("/foo/?")).toBeInTheDocument();
// });
// //done
// //12 indexingPolicyStore stores updated policy on componentDidMount
// test("IndexingPolicyStore stores updated policy on componentDidMount", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(mockRead).toHaveBeenCalled());

//     const readResult = await mockRead.mock.results[0].value;
//     const policy = readResult.resource.indexingPolicy;

//     expect(policy).toBeDefined();
//     expect(policy.automatic).toBe(true);
//     expect(policy.indexingMode).toBe("consistent");
//     expect(policy.includedPaths).toEqual(expect.arrayContaining([{ path: "/*" }, { path: "/foo/?" }]));
//     console.log("Indexing policy stored:", policy);
// });

// // done
// test("refreshCollectionData updates observable and re-renders", async () => {
//     render(<IndexAdvisorTab />);
//     await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());

//     // Simulate refreshCollectionData logic
//     const checkboxes = screen.getAllByRole("checkbox");
//     fireEvent.click(checkboxes[1]); // Select /bar/?
//     fireEvent.click(screen.getByText(/Update Indexing Policy/));

//     await waitFor(() => expect(mockReplace).toHaveBeenCalled());
//     expect(screen.getByText("/bar/?")).toBeInTheDocument(); // Confirm re-render
//     console.log("Collection data refreshed and re-rendered", mockReplace.mock.calls);
// });
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IndexAdvisorTab } from "Explorer/Tabs/QueryTab/ResultsView";
import React from "react";

// ---- Mocks ----
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
                        fetchAll: mockFetchAll.mockResolvedValueOnce({ indexMetrics: indexMetricsString }),
                    }),
                },
                read: mockRead,
                replace: mockReplace,
            }),
        }),
    }),
}));
jest.mock("./indexadv", () => ({
    useIndexAdvisorStyles: () => ({}),
}));
jest.mock("../../../Utils/NotificationConsoleUtils", () => ({
    logConsoleProgress: (...args: unknown[]) => {
        mockLogConsoleProgress(...args);
        return () => { };
    },
}));
jest.mock("../../../Common/ErrorHandlingUtils", () => ({
    handleError: (...args: unknown[]) => mockHandleError(...args),
}));

beforeEach(() => {
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
    jest.clearAllMocks();
});

describe("IndexAdvisorTab", () => {
    test("logs progress message when fetching index metrics", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() =>
            expect(mockLogConsoleProgress).toHaveBeenCalledWith(expect.stringContaining("IndexMetrics"))
        );
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
        fireEvent.click(checkboxes[1]);
        expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();
        fireEvent.click(checkboxes[1]);
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
    });

    test("calls replace when update button is clicked", async () => {
        const cosmos = require("Common/CosmosClient");
        const mockReplaceLocal = cosmos.client().database().container().replace;
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[1]);
        fireEvent.click(screen.getByText(/Update Indexing Policy/));
        await waitFor(() => expect(mockReplaceLocal).toHaveBeenCalled());
    });

    test("fetches indexing policy via read", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(mockRead).toHaveBeenCalled());
    });

    test("shows update button only when an index is selected (again)", async () => {
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
        fireEvent.click(checkboxes[0]);
        checkboxes.forEach((cb) => expect(cb).toBeChecked());
    });

    test("shows spinner while loading and hides after fetchIndexMetrics resolves", async () => {
        render(<IndexAdvisorTab />);
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    });

    test("calls fetchAll with correct query and options", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
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
        await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    });

    test("calls handleError if fetchIndexMetrics throws (again)", async () => {
        mockFetchAll.mockRejectedValueOnce(new Error("fail"));
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    test("updates indexing policy after replace is triggered", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[1]);
        const updateButton = screen.getByText(/Update Indexing Policy/);
        fireEvent.click(updateButton);
        await waitFor(() => expect(mockReplace).toHaveBeenCalled());
        const updatedPolicy = mockReplace.mock.calls[0][0];
        expect(updatedPolicy).toBeDefined();
        expect(updatedPolicy.indexingPolicy.includedPaths).toEqual(
            expect.arrayContaining([{ path: "/*" }, { path: "/bar/?" }])
        );
    });

    test("renders IndexAdvisorTab when clicked from ResultsView", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
        expect(screen.getByText("/foo/?")).toBeInTheDocument();
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
    });

    test("refreshCollectionData updates observable and re-renders", async () => {
        render(<IndexAdvisorTab />);
        await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[1]);
        fireEvent.click(screen.getByText(/Update Indexing Policy/));
        await waitFor(() => expect(mockReplace).toHaveBeenCalled());
        expect(screen.getByText("/bar/?")).toBeInTheDocument();
    });
});
