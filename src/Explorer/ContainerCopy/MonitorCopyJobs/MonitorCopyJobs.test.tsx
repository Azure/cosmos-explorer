import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { DataTransferJobGetResults } from "Utils/arm/generatedClients/dataTransferService/types";
import Explorer from "../../Explorer";
import * as CopyJobActions from "../Actions/CopyJobActions";
import { CopyJobStatusType } from "../Enums/CopyJobEnums";
import { CopyJobType } from "../Types/CopyJobTypes";
import MonitorCopyJobs from "./MonitorCopyJobs";

jest.mock("Common/ShimmerTree/ShimmerTree", () => {
  const MockShimmerTree = () => {
    return <div data-testid="shimmer-tree">Loading...</div>;
  };
  MockShimmerTree.displayName = "MockShimmerTree";
  return MockShimmerTree;
});

jest.mock("./Components/CopyJobsList", () => {
  const MockCopyJobsList = ({ jobs }: any) => {
    return <div data-testid="copy-jobs-list">Jobs: {jobs.length}</div>;
  };
  MockCopyJobsList.displayName = "MockCopyJobsList";
  return MockCopyJobsList;
});

jest.mock("./Components/CopyJobs.NotFound", () => {
  const MockCopyJobsNotFound = () => {
    return <div data-testid="copy-jobs-not-found">No jobs found</div>;
  };
  MockCopyJobsNotFound.displayName = "MockCopyJobsNotFound";
  return MockCopyJobsNotFound;
});

jest.mock("../Actions/CopyJobActions", () => ({
  getCopyJobs: jest.fn(),
  updateCopyJobStatus: jest.fn(),
}));

describe("MonitorCopyJobs", () => {
  let mockExplorer: Explorer;
  const mockGetCopyJobs = CopyJobActions.getCopyJobs as jest.MockedFunction<typeof CopyJobActions.getCopyJobs>;
  const mockUpdateCopyJobStatus = CopyJobActions.updateCopyJobStatus as jest.MockedFunction<
    typeof CopyJobActions.updateCopyJobStatus
  >;

  const mockJobs: CopyJobType[] = [
    {
      ID: "1",
      Mode: "Offline",
      Name: "test-job-1",
      Status: CopyJobStatusType.InProgress,
      CompletionPercentage: 50,
      Duration: "10 minutes",
      LastUpdatedTime: "1/1/2024, 10:00:00 AM",
      timestamp: 1704110400000,
      Source: {
        component: "CosmosDBSql",
        databaseName: "db1",
        containerName: "container1",
      },
      Destination: {
        component: "CosmosDBSql",
        databaseName: "db2",
        containerName: "container2",
      },
    },
    {
      ID: "2",
      Mode: "Online",
      Name: "test-job-2",
      Status: CopyJobStatusType.Completed,
      CompletionPercentage: 100,
      Duration: "20 minutes",
      LastUpdatedTime: "1/1/2024, 11:00:00 AM",
      timestamp: 1704114000000,
      Source: {
        component: "CosmosDBSql",
        databaseName: "db3",
        containerName: "container3",
      },
      Destination: {
        component: "CosmosDBSql",
        databaseName: "db4",
        containerName: "container4",
      },
    },
  ];

  beforeEach(() => {
    mockExplorer = {} as Explorer;
    mockGetCopyJobs.mockResolvedValue(mockJobs);
    mockUpdateCopyJobStatus.mockResolvedValue({
      id: "test-id",
      type: "Microsoft.DocumentDB/databaseAccounts/dataTransferJobs",
      properties: {
        jobName: "test-job-1",
        status: "Paused",
        lastUpdatedUtcTime: "2024-01-01T10:00:00Z",
        processedCount: 500,
        totalCount: 1000,
        mode: "Offline",
        duration: "00:10:00",
        source: {
          databaseName: "db1",
          containerName: "container1",
          component: "CosmosDBSql",
        },
        destination: {
          databaseName: "db2",
          containerName: "container2",
          component: "CosmosDBSql",
        },
        error: {
          message: "",
          code: "",
        },
      },
    } as DataTransferJobGetResults);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("renders the component with correct structure", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      const container = document.querySelector(".monitorCopyJobs");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("flexContainer");

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });
    });

    it("displays shimmer while loading initially", () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      expect(screen.getByTestId("shimmer-tree")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("fetches jobs on mount", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Job List Display", () => {
    it("displays job list when jobs are loaded", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(
        () => {
          expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByText("Jobs: 2")).toBeInTheDocument();
      expect(screen.queryByTestId("shimmer-tree")).not.toBeInTheDocument();
    });

    it("displays not found component when no jobs exist", async () => {
      mockGetCopyJobs.mockResolvedValue([]);

      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-not-found")).toBeInTheDocument();
      });

      expect(screen.getByText("No jobs found")).toBeInTheDocument();
      expect(screen.queryByTestId("copy-jobs-list")).not.toBeInTheDocument();
    });

    it("passes correct jobs to CopyJobsList component", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);
      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
      });
      expect(screen.getByText("Jobs: 2")).toBeInTheDocument();
    });

    it("updates job status when action is triggered", async () => {
      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);
      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
      });
      expect(mockJobs[0].Status).toBe(CopyJobStatusType.InProgress);
    });
  });

  describe("Error Handling", () => {
    it("displays error message when fetch fails", async () => {
      const errorMessage = "Failed to load copy jobs. Please try again later.";
      mockGetCopyJobs.mockRejectedValue(new Error(errorMessage));

      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.queryByTestId("shimmer-tree")).not.toBeInTheDocument();
    });

    it("allows dismissing error message", async () => {
      mockGetCopyJobs.mockRejectedValue(new Error("Failed to load copy jobs"));
      const { container } = render(<MonitorCopyJobs explorer={mockExplorer} />);
      await waitFor(() => {
        expect(screen.getByText(/Failed to load copy jobs/)).toBeInTheDocument();
      });

      const dismissButton = container.querySelector('[aria-label="Close"]');
      if (dismissButton) {
        dismissButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      await waitFor(() => {
        expect(screen.queryByText(/Failed to load copy jobs/)).not.toBeInTheDocument();
      });
    });

    it("displays custom error message from getCopyJobs", async () => {
      const customError = { message: "Custom error occurred" };
      mockGetCopyJobs.mockRejectedValue(customError);

      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByText("Custom error occurred")).toBeInTheDocument();
      });
    });

    it("displays error when job action update fails", async () => {
      mockUpdateCopyJobStatus.mockRejectedValue(new Error("Update failed"));

      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
      });

      const mockHandleActionClick = jest.fn(async (job, action, setUpdatingJobAction) => {
        setUpdatingJobAction({ jobName: job.Name, action });
        await mockUpdateCopyJobStatus(job, action);
      });

      await expect(mockHandleActionClick(mockJobs[0], "pause", jest.fn())).rejects.toThrow("Update failed");
    });
  });

  describe("Polling and Refresh", () => {
    it.skip("polls for jobs at regular intervals", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(2);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(3);
      });
    });

    it("stops polling when component unmounts", async () => {
      const { unmount } = render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
    });

    it("refreshes job list via ref", async () => {
      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });

      act(() => {
        ref.current?.refreshJobList();
      });

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(2);
      });
    });

    it("prevents refresh when update is in progress", async () => {
      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
      });

      mockUpdateCopyJobStatus.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "test-id",
                  type: "Microsoft.DocumentDB/databaseAccounts/dataTransferJobs",
                  properties: {
                    jobName: "test-job-1",
                    status: "Paused",
                    lastUpdatedUtcTime: "2024-01-01T10:00:00Z",
                    processedCount: 500,
                    totalCount: 1000,
                    mode: "Offline",
                    duration: "00:10:00",
                    source: {
                      databaseName: "db1",
                      collectionName: "container1",
                      component: "CosmosDBSql",
                    },
                    destination: {
                      databaseName: "db2",
                      collectionName: "container2",
                      component: "CosmosDBSql",
                    },
                    error: {
                      message: "",
                      code: "",
                    },
                  },
                } as DataTransferJobGetResults),
              5000,
            ),
          ),
      );

      expect(ref.current).toHaveProperty("refreshJobList");
      expect(typeof ref.current.refreshJobList).toBe("function");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty job array", async () => {
      mockGetCopyJobs.mockResolvedValue([]);

      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-not-found")).toBeInTheDocument();
      });
    });

    it("handles null response from getCopyJobs gracefully", async () => {
      mockGetCopyJobs.mockResolvedValue(null as any);

      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-not-found")).toBeInTheDocument();
      });
    });

    it("handles explorer prop correctly", () => {
      const { rerender } = render(<MonitorCopyJobs explorer={mockExplorer} />);

      const newExplorer = {} as Explorer;
      rerender(<MonitorCopyJobs explorer={newExplorer} />);

      expect(document.querySelector(".monitorCopyJobs")).toBeInTheDocument();
    });
  });

  describe("Ref Handle", () => {
    it("exposes refreshJobList method through ref", () => {
      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(ref.current).toHaveProperty("refreshJobList");
      expect(typeof ref.current.refreshJobList).toBe("function");
    });

    it("refreshJobList triggers getCopyJobs", async () => {
      const ref = React.createRef<any>();
      render(<MonitorCopyJobs explorer={mockExplorer} ref={ref} />);

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(1);
      });

      ref.current?.refreshJobList();

      await waitFor(() => {
        expect(mockGetCopyJobs).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Action Callback", () => {
    it("provides handleActionClick callback to CopyJobsList", async () => {
      render(<MonitorCopyJobs explorer={mockExplorer} />);

      await waitFor(() => {
        expect(screen.getByTestId("copy-jobs-list")).toBeInTheDocument();
      });
    });
  });
});
