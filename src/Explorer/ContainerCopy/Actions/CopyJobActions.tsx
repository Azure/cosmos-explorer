import { configContext } from "ConfigContext";
import React from "react";
import { userContext } from "UserContext";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { armRequest } from "../../../Utils/arm/request";
import ContainerCopyMessages from "../ContainerCopyMessages";
import {
    buildDataTransferJobPath,
    convertTime,
    convertToCamelCase,
    COPY_JOB_API_VERSION,
    COSMOS_SQL_COMPONENT,
    extractErrorMessage,
    formatUTCDateTime
} from "../CopyJobUtils";
import CreateCopyJobScreensProvider from "../CreateCopyJob/Screens/CreateCopyJobScreensProvider";
import { CopyJobStatusType } from "../Enums";
import { CopyJobContextState, CopyJobError, CopyJobType, DataTransferJobType } from "../Types";

export const openCreateCopyJobPanel = () => {
    const sidePanelState = useSidePanel.getState()
    sidePanelState.setPanelHasConsole(false);
    sidePanelState.openSidePanel(
        ContainerCopyMessages.createCopyJobPanelTitle,
        <CreateCopyJobScreensProvider />,
        "650px"
    );
}

export const getCopyJobs = async (): Promise<CopyJobType[]> => {
    try {
        const path = buildDataTransferJobPath({
            subscriptionId: userContext.subscriptionId,
            resourceGroup: userContext.databaseAccount?.resourceGroup || "",
            accountName: userContext.databaseAccount?.name || ""
        });

        const response: { value: DataTransferJobType[] } = await armRequest({
            host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion: COPY_JOB_API_VERSION
        });

        const jobs = response.value || [];
        if (!Array.isArray(jobs)) {
            throw new Error("Invalid migration job status response: Expected an array of jobs.");
        }

        /* added a lower bound to "0" and upper bound to "100" */
        const calculateCompletionPercentage = (processed: number, total: number): number => {
            if (
                typeof processed !== 'number' ||
                typeof total !== 'number' ||
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
            .filter((job: DataTransferJobType) =>
                job.properties?.source?.component === COSMOS_SQL_COMPONENT &&
                job.properties?.destination?.component === COSMOS_SQL_COMPONENT
            )
            .sort((current: DataTransferJobType, next: DataTransferJobType) =>
                new Date(next.properties.lastUpdatedUtcTime).getTime() - new Date(current.properties.lastUpdatedUtcTime).getTime()
            )
            .map((job: DataTransferJobType, index: number) => {
                const dateTimeObj = formatUTCDateTime(job.properties.lastUpdatedUtcTime);

                return {
                    ID: (index + 1).toString(),
                    Mode: job.properties.mode,
                    Name: job.properties.jobName,
                    Status: convertToCamelCase(job.properties.status) as CopyJobType["Status"],
                    CompletionPercentage: calculateCompletionPercentage(job.properties.processedCount, job.properties.totalCount),
                    Duration: convertTime(job.properties.duration),
                    LastUpdatedTime: dateTimeObj.formattedDateTime,
                    timestamp: dateTimeObj.timestamp,
                    Error: job.properties.error ? extractErrorMessage(job.properties.error) : null,
                } as CopyJobType;
            });
        return formattedJobs;
    } catch (error) {
        const errorContent = JSON.stringify(error.content || error);
        console.error(`Error fetching copy jobs: ${errorContent}`);
        throw error;
    }
}

export const submitCreateCopyJob = async (state: CopyJobContextState) => {
    try {
        const { source, target, migrationType, jobName } = state;
        const path = buildDataTransferJobPath({
            subscriptionId: userContext.subscriptionId,
            resourceGroup: userContext.databaseAccount?.resourceGroup || "",
            accountName: userContext.databaseAccount?.name || "",
            jobName
        });
        const body = {
            "properties": {
                "source": {
                    "component": "CosmosDBSql",
                    "remoteAccountName": source?.account?.name,
                    "databaseName": source?.databaseId,
                    "containerName": source?.containerId
                },
                "destination": {
                    "component": "CosmosDBSql",
                    "databaseName": target?.databaseId,
                    "containerName": target?.containerId
                },
                "mode": migrationType
            }
        };

        const response: { value: DataTransferJobType } = await armRequest({
            host: configContext.ARM_ENDPOINT, path, method: "PUT", body, apiVersion: COPY_JOB_API_VERSION
        });
        return response.value;
    } catch (error) {
        console.error("Error submitting create copy job:", error);
        throw error;
    }
}

export const updateCopyJobStatus = async (job: CopyJobType, action: string): Promise<DataTransferJobType> => {
    try {
        const path = buildDataTransferJobPath({
            subscriptionId: userContext.subscriptionId,
            resourceGroup: userContext.databaseAccount?.resourceGroup || "",
            accountName: userContext.databaseAccount?.name || "",
            jobName: job.Name,
            action: action
        });

        const response: { value: DataTransferJobType } = await armRequest({
            host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion: COPY_JOB_API_VERSION
        });
        return response.value;
    } catch (error) {
        const errorMessage = JSON.stringify((error as CopyJobError).message || error.content || error);

        const statusList = [CopyJobStatusType.Running, CopyJobStatusType.InProgress, CopyJobStatusType.Partitioning];
        const pattern = new RegExp(`'(${statusList.join('|')})'`, 'g');
        const normalizedErrorMessage = errorMessage.replace(pattern, `'${ContainerCopyMessages.MonitorJobs.Status.InProgress}'`);

        console.error(`Error updating copy job status: ${normalizedErrorMessage}`);
        throw error;
    }
}
