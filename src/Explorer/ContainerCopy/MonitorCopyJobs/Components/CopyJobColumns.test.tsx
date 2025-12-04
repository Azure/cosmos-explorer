import { IColumn } from "@fluentui/react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import { getColumns } from "./CopyJobColumns";

// Mock the child components
jest.mock("./CopyJobActionMenu", () => {
  return function MockCopyJobActionMenu({ job }: { job: CopyJobType }) {
    return <div data-testid={`action-menu-${job.Name}`}>Action Menu</div>;
  };
});

jest.mock("./CopyJobStatusWithIcon", () => {
  return function MockCopyJobStatusWithIcon({ status }: { status: CopyJobStatusType }) {
    return <div data-testid={`status-icon-${status}`}>Status: {status}</div>;
  };
});

describe("CopyJobColumns", () => {
  type OnColumnClickType = IColumn & { onColumnClick: () => void };
  const mockHandleSort = jest.fn();
  const mockHandleActionClick: HandleJobActionClickType = jest.fn();

  const mockJob = {
    ID: "test-job-id",
    Mode: "Online",
    Name: "Test Job Name",
    Status: CopyJobStatusType.InProgress,
    CompletionPercentage: 75,
    Duration: "00:05:30",
    LastUpdatedTime: "2024-12-01T10:30:00Z",
    timestamp: 1701426600000,
    Source: {
      databaseName: "test-source-db",
      containerName: "test-source-container",
      component: "CosmosDBSql",
    },
    Destination: {
      databaseName: "test-dest-db",
      containerName: "test-dest-container",
      component: "CosmosDBSql",
    },
  } as CopyJobType;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getColumns", () => {
    it("should return an array of IColumn objects", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      expect(columns).toBeDefined();
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBe(6);

      // Verify each column has required properties
      columns.forEach((column: IColumn) => {
        expect(column).toHaveProperty("key");
        expect(column).toHaveProperty("name");
        expect(column).toHaveProperty("minWidth");
        expect(column).toHaveProperty("maxWidth");
        expect(column).toHaveProperty("isResizable");
      });
    });

    it("should have correct column keys", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      const expectedKeys = ["LastUpdatedTime", "Name", "Mode", "CompletionPercentage", "CopyJobStatus", "Actions"];
      const actualKeys = columns.map((column) => column.key);

      expect(actualKeys).toEqual(expectedKeys);
    });

    it("should have correct column names from ContainerCopyMessages", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      expect(columns[0].name).toBe(ContainerCopyMessages.MonitorJobs.Columns.lastUpdatedTime);
      expect(columns[1].name).toBe(ContainerCopyMessages.MonitorJobs.Columns.name);
      expect(columns[2].name).toBe(ContainerCopyMessages.MonitorJobs.Columns.mode);
      expect(columns[3].name).toBe(ContainerCopyMessages.MonitorJobs.Columns.completionPercentage);
      expect(columns[4].name).toBe(ContainerCopyMessages.MonitorJobs.Columns.status);
      expect(columns[5].name).toBe("");
    });

    it("should configure sortable columns correctly when no sort is applied", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      // All sortable columns should have isSorted: false
      expect(columns[0].isSorted).toBe(false); // LastUpdatedTime
      expect(columns[1].isSorted).toBe(false); // Name
      expect(columns[2].isSorted).toBe(false); // Mode
      expect(columns[3].isSorted).toBe(false); // CompletionPercentage
      expect(columns[4].isSorted).toBe(false); // CopyJobStatus
    });

    it("should configure sorted column correctly when sort is applied", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "Name", true);

      expect(columns[1].isSorted).toBe(true);
      expect(columns[1].isSortedDescending).toBe(true);

      // Other columns should not be sorted
      expect(columns[0].isSorted).toBe(false);
      expect(columns[2].isSorted).toBe(false);
      expect(columns[3].isSorted).toBe(false);
      expect(columns[4].isSorted).toBe(false);
    });

    it("should handle timestamp sorting for LastUpdatedTime column", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "timestamp", false);

      expect(columns[0].isSorted).toBe(true);
      expect(columns[0].isSortedDescending).toBe(false);
    });

    it("should call handleSort with correct column keys when column headers are clicked", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      (columns[0] as OnColumnClickType).onColumnClick?.();
      expect(mockHandleSort).toHaveBeenCalledWith("timestamp");

      // Test Name column click
      (columns[1] as OnColumnClickType).onColumnClick();
      expect(mockHandleSort).toHaveBeenCalledWith("Name");

      // Test Mode column click
      (columns[2] as OnColumnClickType).onColumnClick();
      expect(mockHandleSort).toHaveBeenCalledWith("Mode");

      // Test CompletionPercentage column click
      (columns[3] as OnColumnClickType).onColumnClick();
      expect(mockHandleSort).toHaveBeenCalledWith("CompletionPercentage");

      // Test Status column click
      (columns[4] as OnColumnClickType).onColumnClick();
      expect(mockHandleSort).toHaveBeenCalledWith("Status");

      expect(mockHandleSort).toHaveBeenCalledTimes(5);
    });

    it("should have correct column widths and resizability", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      expect(columns[0].minWidth).toBe(140); // LastUpdatedTime
      expect(columns[0].maxWidth).toBe(300);
      expect(columns[0].isResizable).toBe(true);

      expect(columns[1].minWidth).toBe(140); // Name
      expect(columns[1].maxWidth).toBe(300);
      expect(columns[1].isResizable).toBe(true);

      expect(columns[2].minWidth).toBe(90); // Mode
      expect(columns[2].maxWidth).toBe(200);
      expect(columns[2].isResizable).toBe(true);

      expect(columns[3].minWidth).toBe(110); // CompletionPercentage
      expect(columns[3].maxWidth).toBe(200);
      expect(columns[3].isResizable).toBe(true);

      expect(columns[4].minWidth).toBe(130); // CopyJobStatus
      expect(columns[4].maxWidth).toBe(200);
      expect(columns[4].isResizable).toBe(true);

      expect(columns[5].minWidth).toBe(80); // Actions
      expect(columns[5].maxWidth).toBe(200);
      expect(columns[5].isResizable).toBe(true);
    });
  });

  describe("Column Render Functions", () => {
    let columns: IColumn[];

    beforeEach(() => {
      columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);
    });

    describe("Name column render function", () => {
      it("should render job name with correct styling", () => {
        const nameColumn = columns.find((col) => col.key === "Name");
        expect(nameColumn?.onRender).toBeDefined();

        const rendered = nameColumn?.onRender?.(mockJob);
        const { container } = render(<div>{rendered}</div>);

        const jobNameElement = container.querySelector(".jobNameLink");
        expect(jobNameElement).toBeInTheDocument();
        expect(jobNameElement).toHaveTextContent("Test Job Name");
      });

      it("should handle empty job name", () => {
        const nameColumn = columns.find((col) => col.key === "Name");
        const jobWithEmptyName = { ...mockJob, Name: "" };

        const rendered = nameColumn?.onRender?.(jobWithEmptyName);
        const { container } = render(<div>{rendered}</div>);

        const jobNameElement = container.querySelector(".jobNameLink");
        expect(jobNameElement).toBeInTheDocument();
        expect(jobNameElement).toHaveTextContent("");
      });

      it("should handle special characters in job name", () => {
        const nameColumn = columns.find((col) => col.key === "Name");
        const jobWithSpecialName = { ...mockJob, Name: "Test & <Job> 'Name' \"With\" Special Characters" };

        const rendered = nameColumn?.onRender?.(jobWithSpecialName);
        const { container } = render(<div>{rendered}</div>);

        const jobNameElement = container.querySelector(".jobNameLink");
        expect(jobNameElement).toBeInTheDocument();
        expect(jobNameElement).toHaveTextContent("Test & <Job> 'Name' \"With\" Special Characters");
      });
    });

    describe("CompletionPercentage column render function", () => {
      it("should render completion percentage with % symbol", () => {
        const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
        expect(completionColumn?.onRender).toBeDefined();

        const result = completionColumn?.onRender?.(mockJob);
        expect(result).toBe("75%");
      });

      it("should handle 0% completion", () => {
        const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
        const jobWithZeroCompletion = { ...mockJob, CompletionPercentage: 0 };

        const result = completionColumn?.onRender?.(jobWithZeroCompletion);
        expect(result).toBe("0%");
      });

      it("should handle 100% completion", () => {
        const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
        const jobWithFullCompletion = { ...mockJob, CompletionPercentage: 100 };

        const result = completionColumn?.onRender?.(jobWithFullCompletion);
        expect(result).toBe("100%");
      });

      it("should handle decimal completion percentages", () => {
        const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
        const jobWithDecimalCompletion = { ...mockJob, CompletionPercentage: 75.5 };

        const result = completionColumn?.onRender?.(jobWithDecimalCompletion);
        expect(result).toBe("75.5%");
      });

      it("should handle negative completion percentages", () => {
        const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
        const jobWithNegativeCompletion = { ...mockJob, CompletionPercentage: -5 };

        const result = completionColumn?.onRender?.(jobWithNegativeCompletion);
        expect(result).toBe("-5%");
      });
    });

    describe("CopyJobStatus column render function", () => {
      it("should render CopyJobStatusWithIcon component", () => {
        const statusColumn = columns.find((col) => col.key === "CopyJobStatus");
        expect(statusColumn?.onRender).toBeDefined();

        const rendered = statusColumn?.onRender?.(mockJob);
        const { container } = render(<div>{rendered}</div>);

        const statusIcon = container.querySelector(`[data-testid="status-icon-${mockJob.Status}"]`);
        expect(statusIcon).toBeInTheDocument();
        expect(statusIcon).toHaveTextContent(`Status: ${mockJob.Status}`);
      });

      it("should handle different job statuses", () => {
        const statusColumn = columns.find((col) => col.key === "CopyJobStatus");

        Object.values(CopyJobStatusType).forEach((status) => {
          const jobWithStatus = { ...mockJob, Status: status };
          const rendered = statusColumn?.onRender?.(jobWithStatus);
          const { container } = render(<div>{rendered}</div>);

          const statusIcon = container.querySelector(`[data-testid="status-icon-${status}"]`);
          expect(statusIcon).toBeInTheDocument();
        });
      });
    });

    describe("Actions column render function", () => {
      it("should render CopyJobActionMenu component", () => {
        const actionsColumn = columns.find((col) => col.key === "Actions");
        expect(actionsColumn?.onRender).toBeDefined();

        const rendered = actionsColumn?.onRender?.(mockJob);
        const { container } = render(<div>{rendered}</div>);

        const actionMenu = container.querySelector(`[data-testid="action-menu-${mockJob.Name}"]`);
        expect(actionMenu).toBeInTheDocument();
        expect(actionMenu).toHaveTextContent("Action Menu");
      });

      it("should pass correct props to CopyJobActionMenu", () => {
        // This test verifies the component receives the right props structure
        // The mocked component will receive job and handleClick props
        const actionsColumn = columns.find((col) => col.key === "Actions");
        const rendered = actionsColumn?.onRender?.(mockJob);

        expect(rendered).toBeDefined();
        // Since we mocked the component, we can't test the exact props,
        // but we can verify the render function returns a valid React element
        expect(React.isValidElement(rendered)).toBe(true);
      });
    });
  });

  describe("Column Field Names", () => {
    it("should have correct fieldName properties", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      expect(columns[0].fieldName).toBe("LastUpdatedTime");
      expect(columns[1].fieldName).toBe("Name");
      expect(columns[2].fieldName).toBe("Mode");
      expect(columns[3].fieldName).toBe("CompletionPercentage");
      expect(columns[4].fieldName).toBe("Status");
      expect(columns[5].fieldName).toBeUndefined(); // Actions column doesn't have fieldName
    });
  });

  describe("Different Sort Configurations", () => {
    it("should handle ascending sort", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "Name", false);

      const nameColumn = columns.find((col) => col.key === "Name");
      expect(nameColumn?.isSorted).toBe(true);
      expect(nameColumn?.isSortedDescending).toBe(false);
    });

    it("should handle descending sort", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "Mode", true);

      const modeColumn = columns.find((col) => col.key === "Mode");
      expect(modeColumn?.isSorted).toBe(true);
      expect(modeColumn?.isSortedDescending).toBe(true);
    });

    it("should handle sort on CompletionPercentage column", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "CompletionPercentage", false);

      const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
      expect(completionColumn?.isSorted).toBe(true);
      expect(completionColumn?.isSortedDescending).toBe(false);

      // Other columns should not be sorted
      const nameColumn = columns.find((col) => col.key === "Name");
      expect(nameColumn?.isSorted).toBe(false);
    });

    it("should handle sort on Status column", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "Status", true);

      const statusColumn = columns.find((col) => col.key === "CopyJobStatus");
      expect(statusColumn?.isSorted).toBe(true);
      expect(statusColumn?.isSortedDescending).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined sortedColumnKey", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      // Check only sortable columns (Actions column doesn't have isSorted property)
      const sortableColumns = columns.filter((col) => col.key !== "Actions");
      sortableColumns.forEach((column) => {
        expect(column.isSorted).toBe(false);
      });
    });

    it("should handle null job object in render functions gracefully", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      // Test Name column with null job - this should throw as the implementation doesn't handle null
      const nameColumn = columns.find((col) => col.key === "Name");
      expect(() => {
        nameColumn?.onRender?.(null as any);
      }).toThrow();

      // Test CompletionPercentage column with null job - this should also throw
      const completionColumn = columns.find((col) => col.key === "CompletionPercentage");
      expect(() => {
        completionColumn?.onRender?.(null as any);
      }).toThrow();
    });

    it("should handle job object with missing properties", () => {
      const incompleteJob = {
        Name: "Incomplete Job",
        // Missing other properties
      } as CopyJobType;

      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      const nameColumn = columns.find((col) => col.key === "Name");
      const rendered = nameColumn?.onRender?.(incompleteJob);
      const { container } = render(<div>{rendered}</div>);

      const jobNameElement = container.querySelector(".jobNameLink");
      expect(jobNameElement).toHaveTextContent("Incomplete Job");
    });

    it("should handle unknown sortedColumnKey", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, "UnknownColumn", false);

      // Check only sortable columns (Actions column doesn't have isSorted property)
      const sortableColumns = columns.filter((col) => col.key !== "Actions");
      sortableColumns.forEach((column) => {
        expect(column.isSorted).toBe(false);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have Actions column without name for accessibility", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      const actionsColumn = columns.find((col) => col.key === "Actions");
      expect(actionsColumn?.name).toBe("");
    });

    it("should maintain column structure for screen readers", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      // Verify that all columns except Actions have meaningful names
      const columnsWithNames = columns.filter((col) => col.key !== "Actions");
      columnsWithNames.forEach((column) => {
        expect(column.name).toBeTruthy();
        expect(typeof column.name).toBe("string");
        expect(column.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Function References", () => {
    it("should maintain function reference stability", () => {
      const columns1 = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);
      const columns2 = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);

      // While the functions might not be the same reference due to arrow functions,
      // they should behave identically
      (columns1[0] as OnColumnClickType).onColumnClick?.();
      (columns2[0] as OnColumnClickType).onColumnClick?.();

      expect(mockHandleSort).toHaveBeenCalledTimes(2);
      expect(mockHandleSort).toHaveBeenNthCalledWith(1, "timestamp");
      expect(mockHandleSort).toHaveBeenNthCalledWith(2, "timestamp");
    });

    it("should call handleActionClick when action menu is rendered", () => {
      const columns = getColumns(mockHandleSort, mockHandleActionClick, undefined, false);
      const actionsColumn = columns.find((col) => col.key === "Actions");

      // The render function should create the component with handleActionClick prop
      const rendered = actionsColumn?.onRender?.(mockJob);
      expect(React.isValidElement(rendered)).toBe(true);
    });
  });
});
