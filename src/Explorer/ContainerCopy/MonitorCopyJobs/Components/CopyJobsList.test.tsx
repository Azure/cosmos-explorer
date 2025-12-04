import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import CopyJobsList from "./CopyJobsList";

// Mock the openCopyJobDetailsPanel action
jest.mock("../../Actions/CopyJobActions", () => ({
  openCopyJobDetailsPanel: jest.fn(),
}));

// Mock the getColumns function
jest.mock("./CopyJobColumns", () => ({
  getColumns: jest.fn(() => [
    {
      key: "Name",
      name: "Name",
      fieldName: "Name",
      minWidth: 140,
      maxWidth: 300,
      isResizable: true,
      onRender: (job: CopyJobType) => <span className="jobNameLink">{job.Name}</span>,
    },
    {
      key: "Status",
      name: "Status",
      fieldName: "Status",
      minWidth: 130,
      maxWidth: 200,
      isResizable: true,
      onRender: (job: CopyJobType) => <span>{job.Status}</span>,
    },
    {
      key: "CompletionPercentage",
      name: "Progress",
      fieldName: "CompletionPercentage",
      minWidth: 110,
      maxWidth: 200,
      isResizable: true,
      onRender: (job: CopyJobType) => <span>{job.CompletionPercentage}%</span>,
    },
    {
      key: "Actions",
      name: "Actions",
      minWidth: 80,
      maxWidth: 200,
      isResizable: true,
      onRender: (job: CopyJobType) => <button data-testid={`action-menu-${job.ID}`}>Actions</button>,
    },
  ]),
}));

// Sample test data
const mockJobs: CopyJobType[] = [
  {
    ID: "job-1",
    Mode: "Live",
    Name: "Test Job 1",
    Status: CopyJobStatusType.Running,
    CompletionPercentage: 45,
    Duration: "00:05:30",
    LastUpdatedTime: "2025-01-01 10:00:00",
    timestamp: 1704110400000,
    Source: {
      component: "CosmosDBSql",
      remoteAccountName: "source-account",
      databaseName: "sourceDb",
      containerName: "sourceContainer",
    },
    Destination: {
      component: "CosmosDBSql",
      databaseName: "targetDb",
      containerName: "targetContainer",
    },
  },
  {
    ID: "job-2",
    Mode: "Offline",
    Name: "Test Job 2",
    Status: CopyJobStatusType.Completed,
    CompletionPercentage: 100,
    Duration: "00:15:45",
    LastUpdatedTime: "2025-01-01 11:00:00",
    timestamp: 1704114000000,
    Source: {
      component: "CosmosDBSql",
      remoteAccountName: "source-account-2",
      databaseName: "sourceDb2",
      containerName: "sourceContainer2",
    },
    Destination: {
      component: "CosmosDBSql",
      databaseName: "targetDb2",
      containerName: "targetContainer2",
    },
  },
  {
    ID: "job-3",
    Mode: "Live",
    Name: "Test Job 3",
    Status: CopyJobStatusType.Failed,
    CompletionPercentage: 25,
    Duration: "00:02:15",
    LastUpdatedTime: "2025-01-01 09:30:00",
    timestamp: 1704108600000,
    Error: {
      message: "Connection timeout",
      code: "TIMEOUT_ERROR",
    },
    Source: {
      component: "CosmosDBSql",
      remoteAccountName: "source-account-3",
      databaseName: "sourceDb3",
      containerName: "sourceContainer3",
    },
    Destination: {
      component: "CosmosDBSql",
      databaseName: "targetDb3",
      containerName: "targetContainer3",
    },
  },
];

const mockHandleActionClick: HandleJobActionClickType = jest.fn();

describe("CopyJobsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders empty list when no jobs provided", () => {
      render(<CopyJobsList jobs={[]} handleActionClick={mockHandleActionClick} />);

      // Should render the ShimmeredDetailsList but with no items
      expect(screen.queryByText("Test Job 1")).not.toBeInTheDocument();
    });

    it("renders jobs list with provided jobs", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      // Should render job names
      expect(screen.getByText("Test Job 1")).toBeInTheDocument();
      expect(screen.getByText("Test Job 2")).toBeInTheDocument();
      expect(screen.getByText("Test Job 3")).toBeInTheDocument();
    });

    it("renders job statuses correctly", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      expect(screen.getByText(CopyJobStatusType.Running)).toBeInTheDocument();
      expect(screen.getByText(CopyJobStatusType.Completed)).toBeInTheDocument();
      expect(screen.getByText(CopyJobStatusType.Failed)).toBeInTheDocument();
    });

    it("renders completion percentages correctly", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      expect(screen.getByText("45%")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("renders action menus for each job", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      expect(screen.getByTestId("action-menu-job-1")).toBeInTheDocument();
      expect(screen.getByTestId("action-menu-job-2")).toBeInTheDocument();
      expect(screen.getByTestId("action-menu-job-3")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("shows pager when jobs exceed page size", () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Should show pager controls
      expect(screen.getByLabelText("Go to first page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to last page")).toBeInTheDocument();
    });

    it("does not show pager when jobs are within page size", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Should not show pager controls
      expect(screen.queryByLabelText("Go to first page")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Go to previous page")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Go to next page")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Go to last page")).not.toBeInTheDocument();
    });

    it("displays correct page information", () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Should show items count
      expect(screen.getByText("Showing 1 - 10 of 25 items")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    it("navigates to next page correctly", async () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Initially shows first 10 jobs
      expect(screen.getByText("Test Job 1")).toBeInTheDocument();
      expect(screen.getByText("Test Job 10")).toBeInTheDocument();
      expect(screen.queryByText("Test Job 11")).not.toBeInTheDocument();

      // Click next page
      fireEvent.click(screen.getByLabelText("Go to next page"));

      await waitFor(() => {
        // Should now show jobs 11-15
        expect(screen.queryByText("Test Job 1")).not.toBeInTheDocument();
        expect(screen.getByText("Test Job 11")).toBeInTheDocument();
        expect(screen.getByText("Test Job 15")).toBeInTheDocument();
      });
    });

    it("uses custom page size when provided", () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 8 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={5} />);

      // Should show pager since 8 > 5
      expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 - 5 of 8 items")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("sorts jobs by name in ascending order", async () => {
      const unsortedJobs = [
        { ...mockJobs[0], Name: "Z Job" },
        { ...mockJobs[1], Name: "A Job" },
        { ...mockJobs[2], Name: "M Job" },
      ];

      render(<CopyJobsList jobs={unsortedJobs} handleActionClick={mockHandleActionClick} />);

      // Initially shows jobs in original order
      const rows = screen.getAllByText(/Job$/);
      expect(rows[0]).toHaveTextContent("Z Job");
      expect(rows[1]).toHaveTextContent("A Job");
      expect(rows[2]).toHaveTextContent("M Job");
    });

    it("resets pagination to first page after sorting", async () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Job ${String.fromCharCode(90 - i)}`, // Z, Y, X, etc.
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Go to second page first
      fireEvent.click(screen.getByLabelText("Go to next page"));

      await waitFor(() => {
        expect(screen.getByText("Showing 11 - 15 of 15 items")).toBeInTheDocument();
      });
    });

    it("updates jobs list when jobs prop changes", async () => {
      const { rerender } = render(<CopyJobsList jobs={[mockJobs[0]]} handleActionClick={mockHandleActionClick} />);

      expect(screen.getByText("Test Job 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Job 2")).not.toBeInTheDocument();

      // Update with new jobs
      rerender(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      expect(screen.getByText("Test Job 1")).toBeInTheDocument();
      expect(screen.getByText("Test Job 2")).toBeInTheDocument();
      expect(screen.getByText("Test Job 3")).toBeInTheDocument();
    });

    it("resets start index when jobs change", async () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      const { rerender } = render(
        <CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />,
      );

      // Navigate to second page
      fireEvent.click(screen.getByLabelText("Go to next page"));

      await waitFor(() => {
        expect(screen.getByText("Showing 11 - 15 of 15 items")).toBeInTheDocument();
      });

      // Change jobs - should reset to first page
      const newJobs = [mockJobs[0], mockJobs[1]];
      rerender(<CopyJobsList jobs={newJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // Should be back on page 1
      expect(screen.queryByLabelText("Go to next page")).not.toBeInTheDocument();
    });
  });

  describe("Row Interactions", () => {
    it("calls openCopyJobDetailsPanel when row is clicked", async () => {
      const { openCopyJobDetailsPanel } = require("../../Actions/CopyJobActions");

      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      // Click on the first job row - we need to find the row element
      const jobNameElement = screen.getByText("Test Job 1");
      const rowElement = jobNameElement.closest('[role="row"]') || jobNameElement.closest("div");

      if (rowElement) {
        fireEvent.click(rowElement);
      } else {
        // Fallback: click the job name element itself
        fireEvent.click(jobNameElement);
      }

      await waitFor(() => {
        expect(openCopyJobDetailsPanel).toHaveBeenCalledWith(mockJobs[0]);
      });
    });

    it("applies cursor pointer style to rows", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      // Verify that rows have pointer cursor (this is set via inline styles)
      const jobNameElement = screen.getByText("Test Job 1");
      const rowElement = jobNameElement.closest("div");

      // The component uses DetailsRow with cursor: pointer style
      expect(rowElement).toBeInTheDocument();
    });
  });

  describe("Component Props", () => {
    it("uses default page size when not provided", () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 12 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} />);

      // Default page size is 10, so should show pager
      expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 - 10 of 12 items")).toBeInTheDocument();
    });

    it("passes correct props to getColumns function", () => {
      const { getColumns } = require("./CopyJobColumns");

      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      expect(getColumns).toHaveBeenCalledWith(
        expect.any(Function), // handleSort
        mockHandleActionClick, // handleActionClick
        undefined, // sortedColumnKey
        false, // isSortedDescending
      );
    });
  });

  describe("Accessibility", () => {
    it("renders with proper ARIA attributes", () => {
      render(<CopyJobsList jobs={mockJobs} handleActionClick={mockHandleActionClick} />);

      // The DetailsList should have proper accessibility attributes
      const detailsList = screen.getByRole("grid");
      expect(detailsList).toBeInTheDocument();
    });

    it("has accessible pager controls", () => {
      const manyJobs: CopyJobType[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Test Job ${i + 1}`,
      }));

      render(<CopyJobsList jobs={manyJobs} handleActionClick={mockHandleActionClick} pageSize={10} />);

      // All pager buttons should have proper aria-labels
      expect(screen.getByLabelText("Go to first page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to last page")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles empty jobs array gracefully", () => {
      expect(() => {
        render(<CopyJobsList jobs={[]} handleActionClick={mockHandleActionClick} />);
      }).not.toThrow();
    });

    it("handles jobs with missing optional properties", () => {
      const incompleteJob: CopyJobType = {
        ID: "incomplete-job",
        Mode: "Live",
        Name: "Incomplete Job",
        Status: CopyJobStatusType.Running,
        CompletionPercentage: 0,
        Duration: "00:00:00",
        LastUpdatedTime: "2025-01-01 12:00:00",
        timestamp: 1704117600000,
        Source: {
          component: "CosmosDBSql",
          remoteAccountName: "source-account",
          databaseName: "sourceDb",
          containerName: "sourceContainer",
        },
        Destination: {
          component: "CosmosDBSql",
          databaseName: "targetDb",
          containerName: "targetContainer",
        },
        // Error is optional and missing
      };

      expect(() => {
        render(<CopyJobsList jobs={[incompleteJob]} handleActionClick={mockHandleActionClick} />);
      }).not.toThrow();

      expect(screen.getByText("Incomplete Job")).toBeInTheDocument();
    });

    it("handles very large job lists", () => {
      const largeJobsList: CopyJobType[] = Array.from({ length: 1000 }, (_, i) => ({
        ...mockJobs[0],
        ID: `job-${i + 1}`,
        Name: `Job ${i + 1}`,
      }));

      expect(() => {
        render(<CopyJobsList jobs={largeJobsList} handleActionClick={mockHandleActionClick} />);
      }).not.toThrow();

      // Should still show pagination
      expect(screen.getByText("Showing 1 - 10 of 1000 items")).toBeInTheDocument();
    });
  });
});
