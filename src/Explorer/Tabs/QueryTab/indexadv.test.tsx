// import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// import { IndexAdvisorTab } from "Explorer/Tabs/QueryTab/ResultsView";
// import React from "react";

// // Mock styles and icons
// jest.mock("./indexadv", () => ({
//     useIndexAdvisorStyles: () => ({
//         indexAdvisorImpactDots: "impactDots",
//         indexAdvisorImpactDot: "impactDot",
//         indexAdvisorMessage: "advisorMessage",
//         indexAdvisorTitle: "advisorTitle",
//         indexAdvisorTable: "advisorTable",
//         indexAdvisorGrid: "advisorGrid",
//         indexAdvisorCheckboxSpacer: "checkboxSpacer",
//         indexAdvisorChevronSpacer: "chevronSpacer",
//         indexAdvisorRowBold: "rowBold",
//         indexAdvisorRowNormal: "rowNormal",
//         indexAdvisorRowImpactHeader: "rowImpactHeader",
//         indexAdvisorRowImpact: "rowImpact",
//         indexAdvisorButtonBar: "buttonBar",
//         indexAdvisorButton: "button",
//         indexAdvisorSuccessIcon: "successIcon",
//     }),
// }));
// jest.mock("@fluentui/react-icons", () => ({
//     ChevronDown20Regular: () => <span>ChevronDown</span>,
//     ChevronRight20Regular: () => <span>ChevronRight</span>,
//     CircleFilled: () => <span>Dot</span>,
// }));

// // Mock hooks and context
// jest.mock("../QueryTabComponent", () => ({
//     useQueryMetadataStore: () => ({
//         userQuery: "SELECT * FROM c",
//         databaseId: "db1",
//         containerId: "col1",
//     }),
// }));

// // Mock Cosmos client and SDK
// jest.mock("../../../Common/CosmosClient", () => ({
//     client: () => ({
//         database: () => ({
//             container: () => ({
//                 items: {
//                     query: () => ({
//                         fetchAll: async () => ({
//                             indexMetrics: `
//                 Utilized Single Indexes
//                 Index Spec: /foo/?
//                 Index Impact Score: High
//                 Potential Single Indexes
//                 Index Spec: /bar/?
//                 Index Impact Score: Medium
//                 Potential Single Indexes
//                 Index Spec: /baz/?
//                 Index Impact Score: Low
//               `,
//                         }),
//                     }),
//                 },
//                 read: async () => ({
//                     resource: {
//                         indexingPolicy: {},
//                         partitionKey: "pk",
//                     },
//                 }),
//                 replace: jest.fn(),
//             }),
//         }),
//     }),
// }));

// // Mock notification and error utils
// jest.mock("../../../Utils/NotificationConsoleUtils", () => ({
//     logConsoleProgress: () => () => { },
// }));
// jest.mock("../../../Common/ErrorHandlingUtils", () => ({
//     handleError: jest.fn(),
// }));

// // Mock zustand store
// jest.mock("../ResultsView", () => {
//     const actual = jest.requireActual("../ResultsView");
//     return {
//         ...actual,
//         useIndexingPolicyStore: () => ({
//             indexingPolicy: {},
//             setIndexingPolicyOnly: jest.fn(),
//         }),
//     };
// });

// describe("IndexAdvisorTab - Comprehensive", () => {
//     it("renders loading spinner initially", () => {
//         render(<IndexAdvisorTab />);
//         expect(screen.getByRole("status")).toBeInTheDocument();
//     });

//     it("parses indexMetrics and sets included/notIncluded arrays", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("Indexes analysis")).toBeInTheDocument());
//         expect(screen.getByText("/foo/?")).toBeInTheDocument();
//         expect(screen.getByText("/bar/?")).toBeInTheDocument();
//         expect(screen.getByText("/baz/?")).toBeInTheDocument();
//         expect(screen.getByText("Not Included in Current Policy")).toBeInTheDocument();
//         expect(screen.getByText("Included in Current Policy")).toBeInTheDocument();
//     });

//     it("renders correct number of impact dots for each impact", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/foo/?")).toBeInTheDocument());
//         // There should be 3 dots for High, 2 for Medium, 1 for Low
//         expect(screen.getAllByText("Dot").length).toBeGreaterThanOrEqual(6);
//     });

//     it("selects and deselects an index (handleCheckboxChange)", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//         const checkboxes = screen.getAllByRole("checkbox");
//         // Select /bar/?
//         fireEvent.click(checkboxes[1]);
//         expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();
//         // Deselect /bar/?
//         fireEvent.click(checkboxes[1]);
//         expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
//     });

//     it("selects all indexes (handleSelectAll)", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//         const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
//         fireEvent.click(selectAllCheckbox);
//         expect(screen.getByText(/Update Indexing Policy/)).toBeInTheDocument();
//         // Deselect all
//         fireEvent.click(selectAllCheckbox);
//         expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
//     });

//     it("shows update message after updating policy (handleUpdatePolicy)", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//         const checkboxes = screen.getAllByRole("checkbox");
//         fireEvent.click(checkboxes[1]);
//         fireEvent.click(screen.getByText(/Update Indexing Policy/));
//         await waitFor(() =>
//             expect(
//                 screen.getByText(/Your indexing policy has been updated/)
//             ).toBeInTheDocument()
//         );
//     });

//     it("renders chevrons and toggles sections (renderRow)", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("Included in Current Policy")).toBeInTheDocument());
//         // Click the chevron to toggle showIncluded
//         const chevrons = screen.getAllByText(/Chevron/);
//         fireEvent.click(chevrons[0]);
//         // No error means toggle worked
//     });

//     it("does not render update button if no indexes are selected", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//         expect(screen.queryByText(/Update Indexing Policy/)).not.toBeInTheDocument();
//     });

//     it("handles error in fetchIndexMetrics gracefully", async () => {
//         // Override the client mock to throw
//         jest.spyOn(console, "error").mockImplementation(() => { });
//         jest.mock("../../../Common/CosmosClient", () => ({
//             client: () => ({
//                 database: () => ({
//                     container: () => ({
//                         items: {
//                             query: () => ({
//                                 fetchAll: async () => {
//                                     throw new Error("fetch error");
//                                 },
//                             }),
//                         },
//                         read: async () => ({
//                             resource: {
//                                 indexingPolicy: {},
//                                 partitionKey: "pk",
//                             },
//                         }),
//                         replace: jest.fn(),
//                     }),
//                 }),
//             }),
//         }));
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
//         // Should not crash
//     });

//     it("handles error in handleUpdatePolicy gracefully", async () => {
//         // Override the replace mock to throw
//         const mockReplace = jest.fn().mockRejectedValue(new Error("replace error"));
//         jest.mock("../../../Common/CosmosClient", () => ({
//             client: () => ({
//                 database: () => ({
//                     container: () => ({
//                         items: {
//                             query: () => ({
//                                 fetchAll: async () => ({
//                                     indexMetrics: `
//                     Utilized Single Indexes
//                     Index Spec: /foo/?
//                     Index Impact Score: High
//                   `,
//                                 }),
//                             }),
//                         },
//                         read: async () => ({
//                             resource: {
//                                 indexingPolicy: {},
//                                 partitionKey: "pk",
//                             },
//                         }),
//                         replace: mockReplace,
//                     }),
//                 }),
//             }),
//         }));
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/foo/?")).toBeInTheDocument());
//         const checkboxes = screen.getAllByRole("checkbox");
//         fireEvent.click(checkboxes[1]);
//         fireEvent.click(screen.getByText(/Update Indexing Policy/));
//         await waitFor(() => expect(mockReplace).toHaveBeenCalled());
//         // Should not crash
//     });

//     it("correctly computes selectAll state when all notIncluded are selected", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("/bar/?")).toBeInTheDocument());
//         const checkboxes = screen.getAllByRole("checkbox");
//         // Select all notIncluded indexes
//         fireEvent.click(checkboxes[1]);
//         fireEvent.click(checkboxes[2]);
//         // The selectAll checkbox should be checked
//         expect(checkboxes[0]).toBeChecked();
//     });

//     it("renders all UI elements and table structure", async () => {
//         render(<IndexAdvisorTab />);
//         await waitFor(() => expect(screen.getByText("Indexes analysis")).toBeInTheDocument());
//         expect(screen.getByText("Not Included in Current Policy")).toBeInTheDocument();
//         expect(screen.getByText("Included in Current Policy")).toBeInTheDocument();
//         expect(screen.getByText("Index")).toBeInTheDocument();
//         expect(screen.getByText("Estimated Impact")).toBeInTheDocument();
//         expect(screen.getByRole("table")).toBeInTheDocument();
//     });
// });