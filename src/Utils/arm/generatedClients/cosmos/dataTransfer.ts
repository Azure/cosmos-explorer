import { ErrorResponse } from "@azure/cosmos";
import { userContext } from "UserContext";
import * as NotificationConsoleUtils from "Utils/NotificationConsoleUtils";
import promiseRetry, { AbortError, FailedAttemptError } from "p-retry";
import { configContext } from "../../../../ConfigContext";
import { ARMError, armRequest } from "../../request";
const apiVersion = "2021-11-15-preview";

export async function initiateDataTransfer(
  jobId: string,
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  sourceDatabaseName: string,
  sourceCollectionName: string,
  targetDatabaseName: string,
  targetCollectionName: string,
): Promise<unknown> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/dataTransferJobs/${jobId}`;
  const body = {
    properties: {
      source: {
        component: "CosmosDBSql",
        databaseName: sourceDatabaseName,
        containerName: sourceCollectionName,
      },
      destination: {
        component: "CosmosDBSql",
        databaseName: targetDatabaseName,
        containerName: targetCollectionName,
      },
    },
  };
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

export async function pollDataTransferJob(
  jobId: string,
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
): Promise<unknown> {
  let clearMessage = NotificationConsoleUtils.logConsoleProgress(`Data transfer job ${jobId} in progress`);
  return await promiseRetry(() => pollDataTransferJobJob(jobId, subscriptionId, resourceGroupName, accountName), {
    retries: 500,
    maxTimeout: 5000,
    onFailedAttempt: (error: FailedAttemptError) => {
      clearMessage();
      clearMessage = NotificationConsoleUtils.logConsoleProgress(error.message);
    },
  });
}

async function pollDataTransferJobJob(
  jobId: string,
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
) {
  if (!userContext.authorizationToken) {
    throw new Error("No authority token provided");
  }

  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/dataTransferJobs/${jobId}`;
  const operationStatusUrl = new URL(path, configContext.ARM_ENDPOINT);
  operationStatusUrl.searchParams.append("api-version", configContext.armAPIVersion || apiVersion);
  const response = await window.fetch(operationStatusUrl, {
    headers: {
      Authorization: userContext.authorizationToken,
    },
  });

  if (!response.ok) {
    const errorResponse = (await response.json()) as ErrorResponse;
    const error = new Error(errorResponse.message) as ARMError;
    error.code = errorResponse.code;
    throw new AbortError(error);
  }

  const body = await response.json();
  const status = body.properties.status;
  if (status === "Canceled" || status === "Failed" || status === "Faulted") {
    const errorMessage = body.error ? JSON.stringify(body.error) : "Operation could not be completed";
    const error = new Error(errorMessage);
    NotificationConsoleUtils.logConsoleError(`Data transfer job ${jobId} Failed`);
    throw new AbortError(error);
  }
  if (status === "Completed") {
    NotificationConsoleUtils.logConsoleInfo(`Data transfer job ${jobId} completed`);
    return body;
  }
  const processedCount = body.properties.processedCount;
  const totalCount = body.properties.totalCount;
  const retryMessage = `Data transfer job ${jobId} in progress, total count: ${totalCount}, processed count: ${processedCount}`;
  throw new Error(retryMessage);
}
