import "@testing-library/jest-dom";
import Explorer from "Explorer/Explorer";
import { getDataTransferJobs } from "../../../Common/dataAccess/dataTransfers";
import * as Logger from "../../../Common/Logger";
import { useSidePanel } from "../../../hooks/useSidePanel";
import * as dataTransferService from "../../../Utils/arm/generatedClients/dataTransferService/dataTransferJobs";
import * as CopyJobUtils from "../CopyJobUtils";
import CreateCopyJobScreensProvider from "../CreateCopyJob/Screens/CreateCopyJobScreensProvider";
import { CopyJobActions, CopyJobStatusType } from "../Enums/CopyJobEnums";
import CopyJobDetails from "../MonitorCopyJobs/Components/CopyJobDetails";
import { MonitorCopyJobsRefState } from "../MonitorCopyJobs/MonitorCopyJobRefState";
import { CopyJobContextState, CopyJobType } from "../Types/CopyJobTypes";
import {
  getCopyJobs,
  openCopyJobDetailsPanel,
  openCreateCopyJobPanel,
  submitCreateCopyJob,
  updateCopyJobStatus,
} from "./CopyJobActions";

jest.mock("UserContext", () => ({
  userContext: {
    databaseAccount: {
      id: "/subscriptions/sub-123/resourceGroups/rg-test/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
    },
  },
}));

jest.mock("../../../hooks/useSidePanel");
jest.mock("../../../Common/Logger");
jest.mock("../../../Utils/arm/generatedClients/dataTransferService/dataTransferJobs");
jest.mock("../MonitorCopyJobs/MonitorCopyJobRefState");
jest.mock("../CopyJobUtils");
jest.mock("../../../Common/dataAccess/dataTransfers");

describe("CopyJobActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("openCreateCopyJobPanel", () => {
    it("should open side panel with correct parameters", () => {
      const mockExplorer = {} as Explorer;
      const mockSetPanelHasConsole = jest.fn();
      const mockOpenSidePanel = jest.fn();

      (useSidePanel.getState as jest.Mock).mockReturnValue({
        setPanelHasConsole: mockSetPanelHasConsole,
        openSidePanel: mockOpenSidePanel,
      });

      openCreateCopyJobPanel(mockExplorer);

      expect(mockSetPanelHasConsole).toHaveBeenCalledWith(false);
      expect(mockOpenSidePanel).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "650px");
    });

    it("should render CreateCopyJobScreensProvider in side panel", () => {
      const mockExplorer = {} as Explorer;
      const mockOpenSidePanel = jest.fn();

      (useSidePanel.getState as jest.Mock).mockReturnValue({
        setPanelHasConsole: jest.fn(),
        openSidePanel: mockOpenSidePanel,
      });

      openCreateCopyJobPanel(mockExplorer);

      const sidePanelContent = mockOpenSidePanel.mock.calls[0][1];
      expect(sidePanelContent.type).toBe(CreateCopyJobScreensProvider);
      expect(sidePanelContent.props.explorer).toBe(mockExplorer);
    });
  });

  describe("openCopyJobDetailsPanel", () => {
    it("should open side panel with job details", () => {
      const mockJob: CopyJobType = {
        ID: "1",
        Mode: "online",
        Name: "test-job",
        Status: CopyJobStatusType.InProgress,
        CompletionPercentage: 50,
        Duration: "01 hours, 30 minutes, 45 seconds",
        LastUpdatedTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
        Source: {
          component: "CosmosDBSql",
          databaseName: "source-db",
          containerName: "source-container",
        },
        Destination: {
          component: "CosmosDBSql",
          databaseName: "target-db",
          containerName: "target-container",
        },
      };

      const mockSetPanelHasConsole = jest.fn();
      const mockOpenSidePanel = jest.fn();

      (useSidePanel.getState as jest.Mock).mockReturnValue({
        setPanelHasConsole: mockSetPanelHasConsole,
        openSidePanel: mockOpenSidePanel,
      });

      openCopyJobDetailsPanel(mockJob);

      expect(mockSetPanelHasConsole).toHaveBeenCalledWith(false);
      expect(mockOpenSidePanel).toHaveBeenCalledWith(expect.stringContaining("test-job"), expect.any(Object), "650px");
    });

    it("should render CopyJobDetails component with correct job", () => {
      const mockJob: CopyJobType = {
        ID: "1",
        Mode: "offline",
        Name: "test-job-2",
        Status: CopyJobStatusType.Completed,
        CompletionPercentage: 100,
        Duration: "02 hours, 15 minutes, 30 seconds",
        LastUpdatedTime: "1/2/2025, 11:00:00 AM",
        timestamp: 1704193200000,
        Source: {
          component: "CosmosDBSql",
          databaseName: "source-db",
          containerName: "source-container",
        },
        Destination: {
          component: "CosmosDBSql",
          databaseName: "target-db",
          containerName: "target-container",
        },
      };

      const mockOpenSidePanel = jest.fn();

      (useSidePanel.getState as jest.Mock).mockReturnValue({
        setPanelHasConsole: jest.fn(),
        openSidePanel: mockOpenSidePanel,
      });

      openCopyJobDetailsPanel(mockJob);

      const sidePanelContent = mockOpenSidePanel.mock.calls[0][1];
      expect(sidePanelContent.type).toBe(CopyJobDetails);
      expect(sidePanelContent.props.job).toBe(mockJob);
    });
  });

  describe("getCopyJobs", () => {
    beforeEach(() => {
      (CopyJobUtils.getAccountDetailsFromResourceId as jest.Mock).mockReturnValue({
        subscriptionId: "sub-123",
        resourceGroup: "rg-test",
        accountName: "test-account",
      });
    });

    it("should fetch and format copy jobs successfully", async () => {
      const mockResponse = [
        {
          properties: {
            jobName: "job-1",
            status: "InProgress",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 50,
            totalCount: 100,
            mode: "online",
            duration: "01:30:45",
            source: {
              component: "CosmosDBSql",
              databaseName: "source-db",
              containerName: "source-container",
            },
            destination: {
              component: "CosmosDBSql",
              databaseName: "target-db",
              containerName: "target-container",
            },
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("01 hours, 30 minutes, 45 seconds");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("InProgress");

      const result = await getCopyJobs();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ID: "1",
        Name: "job-1",
        Status: "InProgress",
        CompletionPercentage: 50,
        Mode: "online",
      });
    });

    it("should filter jobs by CosmosDBSql component", async () => {
      const mockResponse = [
        {
          properties: {
            jobName: "sql-job",
            status: "Completed",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 100,
            totalCount: 100,
            mode: "offline",
            duration: "02:00:00",
            source: { component: "CosmosDBSql", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
          },
        },
        {
          properties: {
            jobName: "other-job",
            status: "Completed",
            lastUpdatedUtcTime: "2025-01-01T11:00:00Z",
            processedCount: 100,
            totalCount: 100,
            mode: "offline",
            duration: "01:00:00",
            source: { component: "OtherComponent", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("02 hours");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("Completed");

      const result = await getCopyJobs();

      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe("sql-job");
    });

    it("should sort jobs by last updated time (newest first)", async () => {
      const mockResponse = [
        {
          properties: {
            jobName: "older-job",
            status: "Completed",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 100,
            totalCount: 100,
            mode: "offline",
            duration: "01:00:00",
            source: { component: "CosmosDBSql", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
          },
        },
        {
          properties: {
            jobName: "newer-job",
            status: "InProgress",
            lastUpdatedUtcTime: "2025-01-02T10:00:00Z",
            processedCount: 50,
            totalCount: 100,
            mode: "online",
            duration: "00:30:00",
            source: { component: "CosmosDBSql", databaseName: "db3", containerName: "c3" },
            destination: { component: "CosmosDBSql", databaseName: "db4", containerName: "c4" },
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("01 hours");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("Completed");

      const result = await getCopyJobs();

      expect(result[0].Name).toBe("newer-job");
      expect(result[1].Name).toBe("older-job");
    });

    it("should calculate completion percentage correctly", async () => {
      const mockResponse = [
        {
          properties: {
            jobName: "job-1",
            status: "InProgress",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 75,
            totalCount: 100,
            mode: "online",
            duration: "01:00:00",
            source: { component: "CosmosDBSql", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("01 hours");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("InProgress");

      const result = await getCopyJobs();

      expect(result[0].CompletionPercentage).toBe(75);
    });

    it("should handle zero total count gracefully", async () => {
      const mockResponse = [
        {
          properties: {
            jobName: "job-1",
            status: "Pending",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 0,
            totalCount: 0,
            mode: "online",
            duration: "00:00:00",
            source: { component: "CosmosDBSql", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("0 seconds");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("Pending");

      const result = await getCopyJobs();

      expect(result[0].CompletionPercentage).toBe(0);
    });

    it("should extract error messages if present", async () => {
      const mockError = {
        message: "Error message line 1\r\n\r\nError message line 2",
        code: "ErrorCode123",
      };
      const mockResponse = [
        {
          properties: {
            jobName: "failed-job",
            status: "Failed",
            lastUpdatedUtcTime: "2025-01-01T10:00:00Z",
            processedCount: 50,
            totalCount: 100,
            mode: "offline",
            duration: "00:30:00",
            source: { component: "CosmosDBSql", databaseName: "db1", containerName: "c1" },
            destination: { component: "CosmosDBSql", databaseName: "db2", containerName: "c2" },
            error: mockError,
          },
        },
      ];

      (getDataTransferJobs as jest.Mock).mockResolvedValue(mockResponse);
      (CopyJobUtils.formatUTCDateTime as jest.Mock).mockReturnValue({
        formattedDateTime: "1/1/2025, 10:00:00 AM",
        timestamp: 1704106800000,
      });
      (CopyJobUtils.convertTime as jest.Mock).mockReturnValue("30 minutes");
      (CopyJobUtils.convertToCamelCase as jest.Mock).mockReturnValue("Failed");
      (CopyJobUtils.extractErrorMessage as jest.Mock).mockReturnValue({
        message: "Error message line 1",
        code: "ErrorCode123",
      });

      const result = await getCopyJobs();

      expect(result[0].Error).toEqual({
        message: "Error message line 1",
        code: "ErrorCode123",
      });
      expect(CopyJobUtils.extractErrorMessage).toHaveBeenCalledWith(mockError);
    });

    it("should abort previous request when new request is made", async () => {
      const mockAbortController = {
        abort: jest.fn(),
        signal: {} as AbortSignal,
      };
      (global as any).AbortController = jest.fn(() => mockAbortController);

      (getDataTransferJobs as jest.Mock).mockResolvedValue([]);

      getCopyJobs();
      expect(mockAbortController.abort).not.toHaveBeenCalled();

      getCopyJobs();
      expect(mockAbortController.abort).toHaveBeenCalledTimes(1);
    });

    it("should throw error for invalid response format", async () => {
      (getDataTransferJobs as jest.Mock).mockResolvedValue("not-an-array");

      await expect(getCopyJobs()).rejects.toThrow("Invalid migration job status response: Expected an array of jobs.");
    });

    it("should handle abort signal error", async () => {
      const abortError = {
        message: "Aborted",
        content: JSON.stringify({ message: "signal is aborted without reason" }),
      };
      (getDataTransferJobs as jest.Mock).mockRejectedValue(abortError);

      await expect(getCopyJobs()).rejects.toMatchObject({
        message: expect.stringContaining("Previous copy job request was cancelled."),
      });
    });

    it("should handle generic errors", async () => {
      const genericError = new Error("Network error");
      (getDataTransferJobs as jest.Mock).mockRejectedValue(genericError);

      await expect(getCopyJobs()).rejects.toThrow("Network error");
    });
  });

  describe("submitCreateCopyJob", () => {
    let mockRefreshJobList: jest.Mock;
    let mockOnSuccess: jest.Mock;

    beforeEach(() => {
      mockRefreshJobList = jest.fn();
      mockOnSuccess = jest.fn();

      (CopyJobUtils.getAccountDetailsFromResourceId as jest.Mock).mockReturnValue({
        subscriptionId: "sub-123",
        resourceGroup: "rg-test",
        accountName: "test-account",
      });

      (MonitorCopyJobsRefState.getState as jest.Mock).mockReturnValue({
        ref: { refreshJobList: mockRefreshJobList },
      });
    });

    it("should create intra-account copy job successfully", async () => {
      const mockState: CopyJobContextState = {
        jobName: "test-job",
        migrationType: "online" as any,
        source: {
          subscription: {} as any,
          account: { id: "account-1", name: "source-account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
        target: {
          subscriptionId: "sub-123",
          account: { id: "account-1", name: "target-account" } as any,
          databaseId: "target-db",
          containerId: "target-container",
        },
      };

      (CopyJobUtils.isIntraAccountCopy as jest.Mock).mockReturnValue(true);
      (dataTransferService.create as jest.Mock).mockResolvedValue({ id: "job-id" });

      await submitCreateCopyJob(mockState, mockOnSuccess);

      expect(dataTransferService.create).toHaveBeenCalledWith(
        "sub-123",
        "rg-test",
        "test-account",
        "test-job",
        expect.objectContaining({
          properties: expect.objectContaining({
            source: expect.objectContaining({
              component: "CosmosDBSql",
              databaseName: "source-db",
              containerName: "source-container",
            }),
            destination: expect.objectContaining({
              component: "CosmosDBSql",
              databaseName: "target-db",
              containerName: "target-container",
            }),
            mode: "online",
          }),
        }),
      );

      const callArgs = (dataTransferService.create as jest.Mock).mock.calls[0][4];
      expect(callArgs.properties.source.remoteAccountName).toBeUndefined();

      expect(mockRefreshJobList).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should create inter-account copy job with source account name", async () => {
      const mockState: CopyJobContextState = {
        jobName: "cross-account-job",
        migrationType: "offline" as any,
        source: {
          subscription: {} as any,
          account: { id: "account-1", name: "source-account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
        target: {
          subscriptionId: "sub-456",
          account: { id: "account-2", name: "target-account" } as any,
          databaseId: "target-db",
          containerId: "target-container",
        },
      };

      (CopyJobUtils.isIntraAccountCopy as jest.Mock).mockReturnValue(false);
      (dataTransferService.create as jest.Mock).mockResolvedValue({ id: "job-id" });

      await submitCreateCopyJob(mockState, mockOnSuccess);

      const callArgs = (dataTransferService.create as jest.Mock).mock.calls[0][4];
      expect(callArgs.properties.source.remoteAccountName).toBe("source-account");
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should handle errors and log them", async () => {
      const mockState: CopyJobContextState = {
        jobName: "failing-job",
        migrationType: "online" as any,
        source: {
          subscription: {} as any,
          account: { id: "account-1", name: "source-account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
        target: {
          subscriptionId: "sub-123",
          account: { id: "account-1", name: "target-account" } as any,
          databaseId: "target-db",
          containerId: "target-container",
        },
      };

      const mockError = new Error("API Error");
      (CopyJobUtils.isIntraAccountCopy as jest.Mock).mockReturnValue(true);
      (dataTransferService.create as jest.Mock).mockRejectedValue(mockError);

      await expect(submitCreateCopyJob(mockState, mockOnSuccess)).rejects.toThrow("API Error");

      expect(Logger.logError).toHaveBeenCalledWith("API Error", "CopyJob/CopyJobActions.submitCreateCopyJob");
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockRefreshJobList).not.toHaveBeenCalled();
    });

    it("should handle errors without message", async () => {
      const mockState: CopyJobContextState = {
        jobName: "test-job",
        migrationType: "online" as any,
        source: {
          subscription: {} as any,
          account: { id: "account-1", name: "source-account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
        target: {
          subscriptionId: "sub-123",
          account: { id: "account-1", name: "target-account" } as any,
          databaseId: "target-db",
          containerId: "target-container",
        },
      };

      (CopyJobUtils.isIntraAccountCopy as jest.Mock).mockReturnValue(true);
      (dataTransferService.create as jest.Mock).mockRejectedValue({});

      await expect(submitCreateCopyJob(mockState, mockOnSuccess)).rejects.toEqual({});

      expect(Logger.logError).toHaveBeenCalledWith(
        "Error submitting create copy job. Please try again later.",
        "CopyJob/CopyJobActions.submitCreateCopyJob",
      );
    });
  });

  describe("updateCopyJobStatus", () => {
    const mockJob: CopyJobType = {
      ID: "1",
      Mode: "online",
      Name: "test-job",
      Status: CopyJobStatusType.InProgress,
      CompletionPercentage: 50,
      Duration: "01 hours, 30 minutes",
      LastUpdatedTime: "1/1/2025, 10:00:00 AM",
      timestamp: 1704106800000,
      Source: {
        component: "CosmosDBSql",
        databaseName: "source-db",
        containerName: "source-container",
      },
      Destination: {
        component: "CosmosDBSql",
        databaseName: "target-db",
        containerName: "target-container",
      },
    };

    beforeEach(() => {
      (CopyJobUtils.getAccountDetailsFromResourceId as jest.Mock).mockReturnValue({
        subscriptionId: "sub-123",
        resourceGroup: "rg-test",
        accountName: "test-account",
      });
    });

    it("should pause a job successfully", async () => {
      const mockResponse = { id: "job-id", properties: { status: "Paused" } };
      (dataTransferService.pause as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateCopyJobStatus(mockJob, CopyJobActions.pause);

      expect(dataTransferService.pause).toHaveBeenCalledWith("sub-123", "rg-test", "test-account", "test-job");
      expect(result).toEqual(mockResponse);
    });

    it("should resume a job successfully", async () => {
      const mockResponse = { id: "job-id", properties: { status: "InProgress" } };
      (dataTransferService.resume as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateCopyJobStatus(mockJob, CopyJobActions.resume);

      expect(dataTransferService.resume).toHaveBeenCalledWith("sub-123", "rg-test", "test-account", "test-job");
      expect(result).toEqual(mockResponse);
    });

    it("should cancel a job successfully", async () => {
      const mockResponse = { id: "job-id", properties: { status: "Cancelled" } };
      (dataTransferService.cancel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateCopyJobStatus(mockJob, CopyJobActions.cancel);

      expect(dataTransferService.cancel).toHaveBeenCalledWith("sub-123", "rg-test", "test-account", "test-job");
      expect(result).toEqual(mockResponse);
    });

    it("should complete a job successfully", async () => {
      const mockResponse = { id: "job-id", properties: { status: "Completed" } };
      (dataTransferService.complete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateCopyJobStatus(mockJob, CopyJobActions.complete);

      expect(dataTransferService.complete).toHaveBeenCalledWith("sub-123", "rg-test", "test-account", "test-job");
      expect(result).toEqual(mockResponse);
    });

    it("should handle case-insensitive action names", async () => {
      const mockResponse = { id: "job-id", properties: { status: "Paused" } };
      (dataTransferService.pause as jest.Mock).mockResolvedValue(mockResponse);

      await updateCopyJobStatus(mockJob, "PAUSE");

      expect(dataTransferService.pause).toHaveBeenCalled();
    });

    it("should throw error for unsupported action", async () => {
      await expect(updateCopyJobStatus(mockJob, "invalid-action")).rejects.toThrow(
        "Unsupported action: invalid-action",
      );

      expect(Logger.logError).toHaveBeenCalled();
    });

    it("should normalize error messages with status types", async () => {
      const mockError = {
        message: "Job must be in 'Running' or 'InProgress' state",
        content: { error: "State error" },
      };
      (dataTransferService.pause as jest.Mock).mockRejectedValue(mockError);

      await expect(updateCopyJobStatus(mockJob, CopyJobActions.pause)).rejects.toEqual(mockError);

      const loggedMessage = (Logger.logError as jest.Mock).mock.calls[0][0];
      expect(loggedMessage).toContain("Error updating copy job status");
    });

    it("should log error with correct context", async () => {
      const mockError = new Error("Network failure");
      (dataTransferService.resume as jest.Mock).mockRejectedValue(mockError);

      await expect(updateCopyJobStatus(mockJob, CopyJobActions.resume)).rejects.toThrow("Network failure");

      expect(Logger.logError).toHaveBeenCalledWith(
        expect.stringContaining("Error updating copy job status"),
        "CopyJob/CopyJobActions.updateCopyJobStatus",
      );
    });

    it("should handle errors with content property", async () => {
      const mockError = {
        content: { message: "Content error message" },
      };
      (dataTransferService.cancel as jest.Mock).mockRejectedValue(mockError);

      await expect(updateCopyJobStatus(mockJob, CopyJobActions.cancel)).rejects.toEqual(mockError);

      expect(Logger.logError).toHaveBeenCalled();
    });
  });
});
