import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { CopyJobActions, CopyJobMigrationType, CopyJobStatusType } from "../../Enums/CopyJobEnums";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import CopyJobActionMenu from "./CopyJobActionMenu";

jest.mock("../../ContainerCopyMessages", () => ({
  __esModule: true,
  default: {
    MonitorJobs: {
      Columns: {
        actions: "Actions",
      },
      Actions: {
        pause: "Pause",
        resume: "Resume",
        cancel: "Cancel",
        complete: "Complete",
      },
    },
  },
}));

describe("CopyJobActionMenu", () => {
  const createMockJob = (overrides: Partial<CopyJobType> = {}): CopyJobType =>
    ({
      ID: "test-job-id",
      Mode: CopyJobMigrationType.Offline,
      Name: "Test Job",
      Status: CopyJobStatusType.InProgress,
      CompletionPercentage: 50,
      Duration: "00:10:30",
      LastUpdatedTime: "2025-01-01T10:00:00Z",
      timestamp: Date.now(),
      Source: {
        databaseName: "sourceDb",
        collectionName: "sourceContainer",
        component: "source",
      },
      Destination: {
        databaseName: "targetDb",
        collectionName: "targetContainer",
        component: "destination",
      },
      ...overrides,
    }) as CopyJobType;

  const mockHandleClick: HandleJobActionClickType = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the action menu button for active jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveAttribute("aria-label", "Actions");
      expect(actionButton).toHaveAttribute("title", "Actions");
    });

    it("should not render anything for completed jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Completed });

      const { container } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render anything for cancelled jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Cancelled });

      const { container } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render anything for failed jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Failed });

      const { container } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render anything for faulted jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Faulted });

      const { container } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Menu Items for Different Job Statuses", () => {
    it("should show pause and cancel actions for InProgress jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Resume")).not.toBeInTheDocument();
    });

    it("should show resume and cancel actions for Paused jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Paused });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Resume")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
    });

    it("should show pause and cancel actions for Pending jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Pending });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Resume")).not.toBeInTheDocument();
    });

    it("should show only resume action for Skipped jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Skipped });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Resume")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("should show pause and cancel actions for Running jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Running });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Resume")).not.toBeInTheDocument();
    });

    it("should show pause and cancel actions for Partitioning jobs", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Partitioning });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Resume")).not.toBeInTheDocument();
    });
  });

  describe("Online Mode Complete Action", () => {
    it("should show complete action for online InProgress jobs", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: CopyJobMigrationType.Online,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Complete")).toBeInTheDocument();
      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should show complete action for online Running jobs", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.Running,
        Mode: CopyJobMigrationType.Online,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("should show complete action for online Partitioning jobs", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.Partitioning,
        Mode: CopyJobMigrationType.Online,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("should not show complete action for offline jobs", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: CopyJobMigrationType.Offline,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    });

    it("should handle case-insensitive online mode detection", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: "ONLINE",
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Action Click Handling", () => {
    it("should call handleClick when pause action is clicked", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const pauseButton = screen.getByText("Pause");
      fireEvent.click(pauseButton);

      expect(mockHandleClick).toHaveBeenCalledWith(job, CopyJobActions.pause, expect.any(Function));
    });

    it("should call handleClick when cancel action is clicked", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockHandleClick).toHaveBeenCalledWith(job, CopyJobActions.cancel, expect.any(Function));
    });

    it("should call handleClick when resume action is clicked", () => {
      const job = createMockJob({ Status: CopyJobStatusType.Paused });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const resumeButton = screen.getByText("Resume");
      fireEvent.click(resumeButton);

      expect(mockHandleClick).toHaveBeenCalledWith(job, CopyJobActions.resume, expect.any(Function));
    });

    it("should call handleClick when complete action is clicked", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: CopyJobMigrationType.Online,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const completeButton = screen.getByText("Complete");
      fireEvent.click(completeButton);

      expect(mockHandleClick).toHaveBeenCalledWith(job, CopyJobActions.complete, expect.any(Function));
    });
  });

  describe("Disabled States During Updates", () => {
    const TestComponentWrapper: React.FC<{
      job: CopyJobType;
      initialUpdatingState?: { jobName: string; action: string } | null;
    }> = ({ job, initialUpdatingState = null }) => {
      const [updatingJobAction, setUpdatingJobAction] = React.useState(initialUpdatingState);

      const testHandleClick: HandleJobActionClickType = (job, action, setUpdatingJobActionCallback) => {
        setUpdatingJobActionCallback({ jobName: job.Name, action });
        setUpdatingJobAction({ jobName: job.Name, action });
      };

      return <CopyJobActionMenu job={job} handleClick={testHandleClick} />;
    };

    it("should disable pause action when job is being paused", async () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<TestComponentWrapper job={job} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const pauseButton = screen.getByText("Pause");
      fireEvent.click(pauseButton);
      fireEvent.click(actionButton);
      const pauseButtonAfterClick = screen.getByText("Pause");
      expect(pauseButtonAfterClick).toBeInTheDocument();
    });

    it("should not disable actions for different jobs when one is updating", () => {
      const job1 = createMockJob({ Name: "Job1", Status: CopyJobStatusType.InProgress });
      const job2 = createMockJob({ Name: "Job2", Status: CopyJobStatusType.InProgress });

      const { rerender } = render(<TestComponentWrapper job={job1} />);
      let actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);
      fireEvent.click(screen.getByText("Pause"));
      rerender(<TestComponentWrapper job={job2} />);

      actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should properly handle multiple action types being disabled for the same job", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      render(<TestComponentWrapper job={job} />);
      const actionButton = screen.getByRole("button", { name: "Actions" });

      fireEvent.click(actionButton);
      fireEvent.click(screen.getByText("Pause"));

      fireEvent.click(actionButton);
      fireEvent.click(screen.getByText("Cancel"));

      fireEvent.click(actionButton);
      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should handle complete action disabled state for online jobs", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: CopyJobMigrationType.Online,
      });

      render(<TestComponentWrapper job={job} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const completeButton = screen.getByText("Complete");
      fireEvent.click(completeButton);

      fireEvent.click(actionButton);
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined mode gracefully", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: undefined as any,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should handle null mode gracefully", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: null as any,
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    });

    it("should handle empty string mode gracefully", () => {
      const job = createMockJob({
        Status: CopyJobStatusType.InProgress,
        Mode: "",
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    });

    it("should return all base items for unknown status", () => {
      const job = createMockJob({ Status: "UnknownStatus" as any });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Resume")).toBeInTheDocument();
    });
  });

  describe("Icon and Accessibility", () => {
    it("should have correct icon and accessibility attributes", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);
      const actionButton = screen.getByRole("button", { name: "Actions" });

      expect(actionButton).toHaveAttribute("aria-label", "Actions");
      expect(actionButton).toHaveAttribute("title", "Actions");

      const moreIcon = actionButton.querySelector('[data-icon-name="More"]');
      expect(moreIcon || actionButton).toBeInTheDocument();
    });

    it("should have correct menu item icons", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);
      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Component State Management", () => {
    it("should manage updating job action state correctly", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      const mockHandleClickWithState: HandleJobActionClickType = jest.fn((job, action, setUpdatingJobAction) => {
        setUpdatingJobAction({ jobName: job.Name, action });
      });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClickWithState} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const pauseButton = screen.getByText("Pause");
      fireEvent.click(pauseButton);

      expect(mockHandleClickWithState).toHaveBeenCalledWith(job, CopyJobActions.pause, expect.any(Function));
    });

    it("should handle rapid successive clicks properly", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });

      render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);
      const pauseButton = screen.getByText("Pause");
      fireEvent.click(pauseButton);
      
      fireEvent.click(actionButton);
      const pauseButton2 = screen.getByText("Pause");
      fireEvent.click(pauseButton2);

      fireEvent.click(actionButton);
      const pauseButton3 = screen.getByText("Pause");
      fireEvent.click(pauseButton3);

      expect(mockHandleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Integration Tests", () => {
    it("should work correctly with different job names", () => {
      const jobWithLongName = createMockJob({
        Name: "Very Long Job Name That Might Cause UI Issues",
        Status: CopyJobStatusType.InProgress,
      });

      render(<CopyJobActionMenu job={jobWithLongName} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const pauseButton = screen.getByText("Pause");
      fireEvent.click(pauseButton);

      expect(mockHandleClick).toHaveBeenCalledWith(jobWithLongName, CopyJobActions.pause, expect.any(Function));
    });

    it("should handle special characters in job names", () => {
      const jobWithSpecialChars = createMockJob({
        Name: "Job-Name_With$pecial#Characters!@",
        Status: CopyJobStatusType.Paused,
      });

      render(<CopyJobActionMenu job={jobWithSpecialChars} handleClick={mockHandleClick} />);

      const actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      const resumeButton = screen.getByText("Resume");
      fireEvent.click(resumeButton);

      expect(mockHandleClick).toHaveBeenCalledWith(jobWithSpecialChars, CopyJobActions.resume, expect.any(Function));
    });

    it("should maintain consistent behavior across re-renders", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      const { rerender } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      let actionButton = screen.getByRole("button", { name: "Actions" });
      expect(actionButton).toBeInTheDocument();

      rerender(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);

      actionButton = screen.getByRole("button", { name: "Actions" });
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should handle prop changes correctly", () => {
      const job1 = createMockJob({ Status: CopyJobStatusType.InProgress });
      const job2 = createMockJob({ Status: CopyJobStatusType.Paused });

      const { rerender } = render(<CopyJobActionMenu job={job1} handleClick={mockHandleClick} />);

      let actionButton = screen.getByRole("button", { name: "Actions" });
      expect(actionButton).toBeInTheDocument();

      rerender(<CopyJobActionMenu job={job2} handleClick={mockHandleClick} />);

      actionButton = screen.getByRole("button", { name: "Actions" });
      fireEvent.click(actionButton);

      expect(screen.getByText("Resume")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
    });
  });

  describe("Performance and Memory", () => {
    it("should not create memory leaks with multiple renders", () => {
      const job = createMockJob({ Status: CopyJobStatusType.InProgress });
      const { unmount } = render(<CopyJobActionMenu job={job} handleClick={mockHandleClick} />);
      expect(() => unmount()).not.toThrow();
    });

    it("should handle null/undefined props gracefully", () => {
      const incompleteJob = {
        ...createMockJob({ Status: CopyJobStatusType.InProgress }),
        Name: undefined as any,
      };

      expect(() => {
        render(<CopyJobActionMenu job={incompleteJob} handleClick={mockHandleClick} />);
      }).not.toThrow();
    });
  });
});
