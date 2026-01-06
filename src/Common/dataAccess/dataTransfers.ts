import { configContext } from "ConfigContext";
import { ApiType, userContext } from "UserContext";
import * as NotificationConsoleUtils from "Utils/NotificationConsoleUtils";
import {
  cancel,
  create,
  get,
  listByDatabaseAccount,
} from "Utils/arm/generatedClients/dataTransferService/dataTransferJobs";
import {
  CosmosCassandraDataTransferDataSourceSink,
  CosmosMongoDataTransferDataSourceSink,
  CosmosSqlDataTransferDataSourceSink,
  CreateJobRequest,
  DataTransferJobFeedResults,
  DataTransferJobGetResults,
} from "Utils/arm/generatedClients/dataTransferService/types";
import { armRequest } from "Utils/arm/request";
import { addToPolling, removeFromPolling, updateDataTransferJob, useDataTransferJobs } from "hooks/useDataTransferJobs";
import promiseRetry, { AbortError, FailedAttemptError } from "p-retry";

export const DATA_TRANSFER_JOB_API_VERSION = "2025-05-01-preview";

export interface DataTransferParams {
  jobName: string;
  apiType: ApiType;
  subscriptionId: string;
  resourceGroupName: string;
  accountName: string;
  sourceDatabaseName: string;
  sourceCollectionName: string;
  targetDatabaseName: string;
  targetCollectionName: string;
}

export const getDataTransferJobs = async (
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  signal?: AbortSignal,
): Promise<DataTransferJobGetResults[]> => {
  let dataTransferJobs: DataTransferJobGetResults[] = [];
  let dataTransferFeeds: DataTransferJobFeedResults = await listByDatabaseAccount(
    subscriptionId,
    resourceGroup,
    accountName,
    signal,
  );
  dataTransferJobs = [...dataTransferJobs, ...(dataTransferFeeds?.value || [])];
  while (dataTransferFeeds?.nextLink) {
    /**
     * The `nextLink` URL returned by the Cosmos DB SQL API pointed to an incorrect endpoint, causing timeouts.
     * (i.e: https://cdbmgmtprodby.documents.azure.com:450/subscriptions/{subId}/resourceGroups/{rg}/providers/Microsoft.DocumentDB/databaseAccounts/{account}/sql/dataTransferJobs?$top=100&$skiptoken=...)
     * We manipulate the URL by parsing it to extract the path and query parameters,
     * then construct the correct URL for the Azure Resource Manager (ARM) API.
     * This ensures that the request is made to the correct base URL (`configContext.ARM_ENDPOINT`),
     * which is required for ARM operations.
     */
    const parsedUrl = new URL(dataTransferFeeds.nextLink);
    const nextUrlPath = parsedUrl.pathname + parsedUrl.search;
    dataTransferFeeds = await armRequest({
      host: configContext.ARM_ENDPOINT,
      path: nextUrlPath,
      method: "GET",
      apiVersion: DATA_TRANSFER_JOB_API_VERSION,
    });
    dataTransferJobs.push(...(dataTransferFeeds?.value || []));
  }
  return dataTransferJobs;
};

export const initiateDataTransfer = async (params: DataTransferParams): Promise<DataTransferJobGetResults> => {
  const {
    jobName,
    apiType,
    subscriptionId,
    resourceGroupName,
    accountName,
    sourceDatabaseName,
    sourceCollectionName,
    targetDatabaseName,
    targetCollectionName,
  } = params;
  const sourcePayload = createPayload(apiType, sourceDatabaseName, sourceCollectionName);
  const targetPayload = createPayload(apiType, targetDatabaseName, targetCollectionName);
  const body: CreateJobRequest = {
    properties: {
      source: sourcePayload,
      destination: targetPayload,
    },
  };
  return create(subscriptionId, resourceGroupName, accountName, jobName, body);
};

export const pollDataTransferJob = async (
  jobName: string,
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
): Promise<unknown> => {
  const currentPollingJobs = useDataTransferJobs.getState().pollingDataTransferJobs;
  if (currentPollingJobs.has(jobName)) {
    return;
  }
  let clearMessage = NotificationConsoleUtils.logConsoleProgress(`Data transfer job ${jobName} in progress`);
  return await promiseRetry(
    () => pollDataTransferJobOperation(jobName, subscriptionId, resourceGroupName, accountName, clearMessage),
    {
      retries: 500,
      maxTimeout: 5000,
      onFailedAttempt: (error: FailedAttemptError) => {
        clearMessage();
        clearMessage = NotificationConsoleUtils.logConsoleProgress(error.message);
      },
    },
  );
};

const pollDataTransferJobOperation = async (
  jobName: string,
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  clearMessage?: () => void,
): Promise<DataTransferJobGetResults> => {
  if (!userContext.authorizationToken) {
    throw new Error("No authority token provided");
  }

  addToPolling(jobName);

  const body: DataTransferJobGetResults = await get(subscriptionId, resourceGroupName, accountName, jobName);
  const status = body?.properties?.status;

  updateDataTransferJob(body);

  if (status === "Cancelled") {
    removeFromPolling(jobName);
    clearMessage && clearMessage();
    const cancelMessage = `Data transfer job ${jobName} cancelled`;
    NotificationConsoleUtils.logConsoleError(cancelMessage);
    throw new AbortError(cancelMessage);
  }
  if (status === "Failed" || status === "Faulted") {
    removeFromPolling(jobName);
    const errorMessage = body?.properties?.error
      ? JSON.stringify(body?.properties?.error)
      : "Operation could not be completed";
    const error = new Error(errorMessage);
    clearMessage && clearMessage();
    NotificationConsoleUtils.logConsoleError(`Data transfer job ${jobName} failed: ${errorMessage}`);
    throw new AbortError(error);
  }
  if (status === "Completed") {
    removeFromPolling(jobName);
    clearMessage && clearMessage();
    NotificationConsoleUtils.logConsoleInfo(`Data transfer job ${jobName} completed`);
    return body;
  }
  const processedCount = body.properties.processedCount;
  const totalCount = body.properties.totalCount;
  const retryMessage = `Data transfer job ${jobName} in progress, total count: ${totalCount}, processed count: ${processedCount}`;
  throw new Error(retryMessage);
};

export const cancelDataTransferJob = async (
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  jobName: string,
): Promise<void> => {
  const cancelResult: DataTransferJobGetResults = await cancel(subscriptionId, resourceGroupName, accountName, jobName);
  updateDataTransferJob(cancelResult);
  removeFromPolling(cancelResult?.properties?.jobName);
};

const createPayload = (
  apiType: ApiType,
  databaseName: string,
  containerName: string,
):
  | CosmosSqlDataTransferDataSourceSink
  | CosmosMongoDataTransferDataSourceSink
  | CosmosCassandraDataTransferDataSourceSink => {
  switch (apiType) {
    case "SQL":
      return {
        component: "CosmosDBSql",
        databaseName: databaseName,
        containerName: containerName,
      } as CosmosSqlDataTransferDataSourceSink;
    case "Mongo":
      return {
        component: "CosmosDBMongo",
        databaseName: databaseName,
        collectionName: containerName,
      } as CosmosMongoDataTransferDataSourceSink;
    case "Cassandra":
      return {
        component: "CosmosDBCassandra",
        keyspaceName: databaseName,
        tableName: containerName,
      };
    default:
      throw new Error(`Unsupported API type for data transfer: ${apiType}`);
  }
};
