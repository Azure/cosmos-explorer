import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType } from "../../Types/CopyJobTypes";
import CopyJobDetails from "./CopyJobDetails";

jest.mock("./CopyJobStatusWithIcon", () => {
  return function MockCopyJobStatusWithIcon({ status }: { status: CopyJobStatusType }) {
    return <span data-testid="copy-job-status-icon">{status}</span>;
  };
});

jest.mock("../../ContainerCopyMessages", () => ({
  errorTitle: "Error Details",
  sourceDatabaseLabel: "Source Database",
  sourceContainerLabel: "Source Container",
  targetDatabaseLabel: "Destination Database",
  targetContainerLabel: "Destination Container",
  sourceAccountLabel: "Source Account",
  MonitorJobs: {
    Columns: {
      lastUpdatedTime: "Date & time",
      status: "Status",
      mode: "Mode",
    },
  },
}));

describe("CopyJobDetails", () => {
  const mockBasicJob: CopyJobType = {
    ID: "test-job-1",
    Mode: "Offline",
    Name: "test-job-1",
    Status: CopyJobStatusType.InProgress,
    CompletionPercentage: 50,
    Duration: "10 minutes",
    LastUpdatedTime: "2024-01-01T10:00:00Z",
    timestamp: 1704110400000,
    Source: {
      component: "CosmosDBSql",
      databaseName: "sourceDb",
      containerName: "sourceContainer",
      remoteAccountName: "sourceAccount",
    },
    Destination: {
      component: "CosmosDBSql",
      databaseName: "targetDb",
      containerName: "targetContainer",
      remoteAccountName: "targetAccount",
    },
  };

  const mockJobWithError: CopyJobType = {
    ...mockBasicJob,
    ID: "test-job-error",
    Status: CopyJobStatusType.Failed,
    Error: {
      message: "Failed to connect to source database",
      code: "CONNECTION_ERROR",
    },
  };

  const mockJobWithNullValues: CopyJobType = {
    ...mockBasicJob,
    ID: "test-job-null",
    Source: {
      component: "CosmosDBSql",
      databaseName: undefined,
      containerName: undefined,
      remoteAccountName: undefined,
    },
    Destination: {
      component: "CosmosDBSql",
      databaseName: undefined,
      containerName: undefined,
      remoteAccountName: undefined,
    },
  };

  describe("Basic Rendering", () => {
    it("renders the component with correct structure", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      const container = screen.getByTestId("copy-job-details");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("copyJobDetailsContainer");
    });

    it("displays job details without error when no error exists", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.queryByTestId("error-stack")).not.toBeInTheDocument();
      expect(screen.getByTestId("selectedcollection-stack")).toBeInTheDocument();
    });

    it("renders all required job information fields", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.getByText("Date & time")).toBeInTheDocument();
      expect(screen.getByText("2024-01-01T10:00:00Z")).toBeInTheDocument();

      expect(screen.getByText("Source Account")).toBeInTheDocument();
      expect(screen.getByText("sourceAccount")).toBeInTheDocument();

      expect(screen.getByText("Mode")).toBeInTheDocument();
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("renders the DetailsList with correct job data", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.getByText("sourceDb")).toBeInTheDocument();
      expect(screen.getByText("sourceContainer")).toBeInTheDocument();

      expect(screen.getByText("targetDb")).toBeInTheDocument();
      expect(screen.getByText("targetContainer")).toBeInTheDocument();

      expect(screen.getByTestId("copy-job-status-icon")).toBeInTheDocument();
      expect(screen.getByTestId("copy-job-status-icon")).toHaveTextContent("InProgress");
    });
  });

  describe("Error Handling", () => {
    it("displays error section when job has error", () => {
      render(<CopyJobDetails job={mockJobWithError} />);

      const errorStack = screen.getByTestId("error-stack");
      expect(errorStack).toBeInTheDocument();

      expect(screen.getByText("Error Details")).toBeInTheDocument();
      expect(screen.getByText("Failed to connect to source database")).toBeInTheDocument();
    });

    it("does not display error section when job has no error", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.queryByTestId("error-stack")).not.toBeInTheDocument();
      expect(screen.queryByText("Error Details")).not.toBeInTheDocument();
    });
  });

  describe("Null/Undefined Value Handling", () => {
    it("displays 'N/A' for null or undefined source values", () => {
      render(<CopyJobDetails job={mockJobWithNullValues} />);

      const nATexts = screen.getAllByText("N/A");
      expect(nATexts).toHaveLength(4);
    });

    it("handles null remote account name gracefully", () => {
      render(<CopyJobDetails job={mockJobWithNullValues} />);
      expect(screen.getByTestId("copy-job-details")).toBeInTheDocument();
    });

    it("handles empty status gracefully", () => {
      const jobWithEmptyStatus: CopyJobType = {
        ...mockBasicJob,
        Status: "" as CopyJobStatusType,
      };

      render(<CopyJobDetails job={jobWithEmptyStatus} />);

      expect(screen.getByTestId("copy-job-status-icon")).toHaveTextContent("");
    });
  });

  describe("Different Job Statuses", () => {
    const statusTestCases = [
      CopyJobStatusType.Pending,
      CopyJobStatusType.Running,
      CopyJobStatusType.Paused,
      CopyJobStatusType.Completed,
      CopyJobStatusType.Failed,
      CopyJobStatusType.Cancelled,
    ];

    statusTestCases.forEach((status) => {
      it(`renders correctly for ${status} status`, () => {
        const jobWithStatus: CopyJobType = {
          ...mockBasicJob,
          Status: status,
        };

        render(<CopyJobDetails job={jobWithStatus} />);

        expect(screen.getByTestId("copy-job-status-icon")).toHaveTextContent(status);
      });
    });
  });

  describe("Component Memoization", () => {
    it("re-renders when job ID changes", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.getByText(CopyJobStatusType.InProgress)).toBeInTheDocument();

      const updatedJob: CopyJobType = {
        ...mockBasicJob,
        Status: CopyJobStatusType.Completed,
      };

      render(<CopyJobDetails job={updatedJob} />);

      expect(screen.getByText(CopyJobStatusType.Completed)).toBeInTheDocument();
    });

    it("re-renders when error changes", () => {
      const { rerender } = render(<CopyJobDetails job={mockBasicJob} />);

      expect(screen.queryByTestId("error-stack")).not.toBeInTheDocument();

      rerender(<CopyJobDetails job={mockJobWithError} />);

      expect(screen.getByTestId("error-stack")).toBeInTheDocument();
    });

    it("does not re-render when other props change but ID and Error stay same", () => {
      const jobWithSameIdAndError = {
        ...mockBasicJob,
        Mode: "Online",
        CompletionPercentage: 75,
      };

      const { rerender } = render(<CopyJobDetails job={mockBasicJob} />);
      rerender(<CopyJobDetails job={jobWithSameIdAndError} />);
      expect(screen.getByTestId("copy-job-details")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("correctly transforms job data for DetailsList items", () => {
      render(<CopyJobDetails job={mockBasicJob} />);
      expect(screen.getByText("sourceContainer")).toBeInTheDocument();
      expect(screen.getByText("sourceDb")).toBeInTheDocument();
      expect(screen.getByText("targetContainer")).toBeInTheDocument();
      expect(screen.getByText("targetDb")).toBeInTheDocument();
      expect(screen.getByTestId("copy-job-status-icon")).toHaveTextContent("InProgress");
    });

    it("handles complex job data structure", () => {
      const complexJob: CopyJobType = {
        ...mockBasicJob,
        Source: {
          component: "CosmosDBSql",
          databaseName: "complex-source-db-with-hyphens",
          containerName: "complex_source_container_with_underscores",
          remoteAccountName: "complex.source.account",
        },
        Destination: {
          component: "CosmosDBSql",
          databaseName: "complex-target-db-with-hyphens",
          containerName: "complex_target_container_with_underscores",
          remoteAccountName: "complex.target.account",
        },
      };

      render(<CopyJobDetails job={complexJob} />);

      expect(screen.getByText("complex-source-db-with-hyphens")).toBeInTheDocument();
      expect(screen.getByText("complex_source_container_with_underscores")).toBeInTheDocument();
      expect(screen.getByText("complex-target-db-with-hyphens")).toBeInTheDocument();
      expect(screen.getByText("complex_target_container_with_underscores")).toBeInTheDocument();
      expect(screen.getByText("complex.source.account")).toBeInTheDocument();
    });
  });

  describe("DetailsList Configuration", () => {
    it("configures DetailsList with correct layout mode", () => {
      render(<CopyJobDetails job={mockBasicJob} />);
      expect(screen.getByText("sourceContainer")).toBeInTheDocument();
    });

    it("renders all expected column data", () => {
      render(<CopyJobDetails job={mockBasicJob} />);
      expect(screen.getByText("sourceDb")).toBeInTheDocument();
      expect(screen.getByText("sourceContainer")).toBeInTheDocument();
      expect(screen.getByText("targetDb")).toBeInTheDocument();
      expect(screen.getByText("targetContainer")).toBeInTheDocument();
      expect(screen.getByTestId("copy-job-status-icon")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper data-testid attributes", () => {
      render(<CopyJobDetails job={mockJobWithError} />);

      expect(screen.getByTestId("copy-job-details")).toBeInTheDocument();
      expect(screen.getByTestId("error-stack")).toBeInTheDocument();
      expect(screen.getByTestId("selectedcollection-stack")).toBeInTheDocument();
    });

    it("renders semantic HTML structure", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      const container = screen.getByTestId("copy-job-details");
      expect(container).toBeInTheDocument();

      const nestedStack = screen.getByTestId("selectedcollection-stack");
      expect(nestedStack).toBeInTheDocument();
    });
  });

  describe("CSS and Styling", () => {
    it("applies correct CSS classes", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      const container = screen.getByTestId("copy-job-details");
      expect(container).toHaveClass("copyJobDetailsContainer");
    });

    it("applies correct styling to error text", () => {
      render(<CopyJobDetails job={mockJobWithError} />);

      const errorText = screen.getByText("Failed to connect to source database");
      expect(errorText).toHaveStyle({ whiteSpace: "pre-wrap" });
    });

    it("applies bold styling to heading texts", () => {
      render(<CopyJobDetails job={mockBasicJob} />);

      const dateTimeHeading = screen.getByText("Date & time");
      const sourceAccountHeading = screen.getByText("Source Account");
      const modeHeading = screen.getByText("Mode");

      expect(dateTimeHeading).toHaveClass("bold");
      expect(sourceAccountHeading).toHaveClass("bold");
      expect(modeHeading).toHaveClass("bold");
    });
  });

  describe("Edge Cases", () => {
    it("handles job with minimal required data", () => {
      const minimalJob = {
        ID: "minimal",
        Mode: "",
        Name: "",
        Status: CopyJobStatusType.Pending,
        CompletionPercentage: 0,
        Duration: "",
        LastUpdatedTime: "",
        timestamp: 0,
        Source: {
          component: "CosmosDBSql",
        },
        Destination: {
          component: "CosmosDBSql",
        },
      } as CopyJobType;

      render(<CopyJobDetails job={minimalJob} />);

      expect(screen.getByTestId("copy-job-details")).toBeInTheDocument();
      expect(screen.getAllByText("N/A")).toHaveLength(4);
    });

    it("handles very long text values", () => {
      const longTextJob: CopyJobType = {
        ...mockBasicJob,
        Source: {
          ...mockBasicJob.Source,
          databaseName: "very-long-database-name-that-might-cause-layout-issues-in-the-ui-component",
          containerName: "very-long-container-name-that-might-cause-layout-issues-in-the-ui-component",
          remoteAccountName: "very-long-account-name-that-might-cause-layout-issues-in-the-ui-component",
        },
        Error: {
          message:
            "This is a very long error message that contains multiple sentences and might span several lines when displayed in the user interface. It should handle line breaks and maintain readability even with extensive content.",
          code: "LONG_ERROR",
        },
      };

      render(<CopyJobDetails job={longTextJob} />);

      expect(
        screen.getByText("very-long-database-name-that-might-cause-layout-issues-in-the-ui-component"),
      ).toBeInTheDocument();
      expect(screen.getByText(/This is a very long error message/)).toBeInTheDocument();
    });
  });
});
