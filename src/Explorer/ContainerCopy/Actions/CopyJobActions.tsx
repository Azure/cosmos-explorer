import React from "react";
import { userContext } from "UserContext";
import { useSidePanel } from "../../../hooks/useSidePanel";
import {
  cancel,
  complete,
  create,
  listByDatabaseAccount,
  pause,
  resume,
} from "../../../Utils/arm/generatedClients/dataTransferService/dataTransferJobs";
import {
  CreateJobRequest,
  DataTransferJobGetResults,
} from "../../../Utils/arm/generatedClients/dataTransferService/types";
import ContainerCopyMessages from "../ContainerCopyMessages";
import {
  convertTime,
  convertToCamelCase,
  COSMOS_SQL_COMPONENT,
  extractErrorMessage,
  formatUTCDateTime,
  getAccountDetailsFromResourceId,
} from "../CopyJobUtils";
import CreateCopyJobScreensProvider from "../CreateCopyJob/Screens/CreateCopyJobScreensProvider";
import { CopyJobActions, CopyJobStatusType } from "../Enums/CopyJobEnums";
import CopyJobDetails from "../MonitorCopyJobs/Components/CopyJobDetails";
import { MonitorCopyJobsRefState } from "../MonitorCopyJobs/MonitorCopyJobRefState";
import { CopyJobContextState, CopyJobError, CopyJobErrorType, CopyJobType } from "../Types/CopyJobTypes";

export const openCreateCopyJobPanel = () => {
  const sidePanelState = useSidePanel.getState();
  sidePanelState.setPanelHasConsole(false);
  sidePanelState.openSidePanel(
    ContainerCopyMessages.createCopyJobPanelTitle,
    <CreateCopyJobScreensProvider />,
    "650px",
  );
};

export const openCopyJobDetailsPanel = (job: CopyJobType) => {
  const sidePanelState = useSidePanel.getState();
  sidePanelState.setPanelHasConsole(false);
  sidePanelState.openSidePanel(
    ContainerCopyMessages.copyJobDetailsPanelTitle(job.Name),
    <CopyJobDetails job={job} />,
    "650px",
  );
};

let copyJobsAbortController: AbortController | null = null;

export const getCopyJobs = async (): Promise<CopyJobType[]> => {
  if (copyJobsAbortController) {
    copyJobsAbortController.abort();
  }
  copyJobsAbortController = new AbortController();
  try {
    const { subscriptionId, resourceGroup, accountName } = getAccountDetailsFromResourceId(
      userContext.databaseAccount?.id || "",
    );
    const response = await listByDatabaseAccount(
      subscriptionId,
      resourceGroup,
      accountName,
      copyJobsAbortController.signal,
    );

    const jobs = response.value || [];
    if (!Array.isArray(jobs)) {
      throw new Error("Invalid migration job status response: Expected an array of jobs.");
    }
    copyJobsAbortController = null;

    /* added a lower bound to "0" and upper bound to "100" */
    const calculateCompletionPercentage = (processed: number, total: number): number => {
      if (
        typeof processed !== "number" ||
        typeof total !== "number" ||
        !isFinite(processed) ||
        !isFinite(total) ||
        total <= 0
      ) {
        return 0;
      }

      const percentage = Math.round((processed / total) * 100);
      return Math.max(0, Math.min(100, percentage));
    };

    const formattedJobs: CopyJobType[] = jobs
      .filter(
        (job: DataTransferJobGetResults) =>
          job.properties?.source?.component === COSMOS_SQL_COMPONENT &&
          job.properties?.destination?.component === COSMOS_SQL_COMPONENT,
      )
      .sort(
        (current: DataTransferJobGetResults, next: DataTransferJobGetResults) =>
          new Date(next.properties.lastUpdatedUtcTime).getTime() -
          new Date(current.properties.lastUpdatedUtcTime).getTime(),
      )
      .map((job: DataTransferJobGetResults, index: number) => {
        const dateTimeObj = formatUTCDateTime(job.properties.lastUpdatedUtcTime);

        return {
          ID: (index + 1).toString(),
          Mode: job.properties.mode,
          Name: job.properties.jobName,
          Source: job.properties.source,
          Destination: job.properties.destination,
          Status: convertToCamelCase(job.properties.status) as CopyJobType["Status"],
          CompletionPercentage: calculateCompletionPercentage(job.properties.processedCount, job.properties.totalCount),
          Duration: convertTime(job.properties.duration),
          LastUpdatedTime: dateTimeObj.formattedDateTime,
          timestamp: dateTimeObj.timestamp,
          Error: job.properties.error ? extractErrorMessage(job.properties.error as unknown as CopyJobErrorType) : null,
        } as CopyJobType;
      });
    return formattedJobs;
  } catch (error) {
    const errorContent = JSON.stringify(error.content || error);
    console.error(`Error fetching copy jobs: ${errorContent}`);
    throw error;
  }
};

export const submitCreateCopyJob = async (state: CopyJobContextState, onSuccess: () => void) => {
  try {
    const { source, target, migrationType, jobName } = state;
    const { subscriptionId, resourceGroup, accountName } = getAccountDetailsFromResourceId(
      userContext.databaseAccount?.id || "",
    );
    const body = {
      properties: {
        source: {
          component: "CosmosDBSql",
          remoteAccountName: source?.account?.name,
          databaseName: source?.databaseId,
          containerName: source?.containerId,
        },
        destination: {
          component: "CosmosDBSql",
          databaseName: target?.databaseId,
          containerName: target?.containerId,
        },
        mode: migrationType,
      },
    } as unknown as CreateJobRequest;

    const response = await create(subscriptionId, resourceGroup, accountName, jobName, body);
    MonitorCopyJobsRefState.getState().ref?.refreshJobList();
    onSuccess();
    return response;
  } catch (error) {
    console.error("Error submitting create copy job:", error);
    throw error;
  }
};

export const updateCopyJobStatus = async (job: CopyJobType, action: string): Promise<DataTransferJobGetResults> => {
  try {
    let updateFn = null;
    switch (action.toLowerCase()) {
      case CopyJobActions.pause:
        updateFn = pause;
        break;
      case CopyJobActions.resume:
        updateFn = resume;
        break;
      case CopyJobActions.cancel:
        updateFn = cancel;
        break;
      case CopyJobActions.complete:
        updateFn = complete;
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    const { subscriptionId, resourceGroup, accountName } = getAccountDetailsFromResourceId(
      userContext.databaseAccount?.id || "",
    );
    const response = await updateFn?.(subscriptionId, resourceGroup, accountName, job.Name);

    return response;
  } catch (error) {
    const errorMessage = JSON.stringify((error as CopyJobError).message || error.content || error);

    const statusList = [CopyJobStatusType.Running, CopyJobStatusType.InProgress, CopyJobStatusType.Partitioning];
    const pattern = new RegExp(`'(${statusList.join("|")})'`, "g");
    const normalizedErrorMessage = errorMessage.replace(
      pattern,
      `'${ContainerCopyMessages.MonitorJobs.Status.InProgress}'`,
    );

    console.error(`Error updating copy job status: ${normalizedErrorMessage}`);
    throw error;
  }
};
