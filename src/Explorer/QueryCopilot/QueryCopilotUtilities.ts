import { FeedOptions, Item, ItemDefinition, QueryIterator, Resource, RetryOptions } from "@azure/cosmos";
import { QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import { getPartitionKeyValue } from "Common/dataAccess/getPartitionKeyValue";
import { getCommonQueryOptions, getQueryRetryOptions } from "Common/dataAccess/queryDocuments";
import DocumentId from "Explorer/Tree/DocumentId";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";

export const querySampleDocuments = (
  query: string,
  options: FeedOptions,
  retryOptions: RetryOptions,
): QueryIterator<ItemDefinition & Resource> => {
  options = getCommonQueryOptions(options);
  retryOptions = getQueryRetryOptions(retryOptions);
  return sampleDataClient()
    .database(QueryCopilotSampleDatabaseId)
    .container(QueryCopilotSampleContainerId)
    .items.query(query, retryOptions, options);
};

export const readSampleDocument = async (documentId: DocumentId): Promise<Item> => {
  const clearMessage = logConsoleProgress(`Reading item ${documentId.id()}`);

  try {
    const response = await sampleDataClient()
      .database(QueryCopilotSampleDatabaseId)
      .container(QueryCopilotSampleContainerId)
      .item(documentId.id(), getPartitionKeyValue(documentId))
      .read();

    return response?.resource;
  } catch (error) {
    handleError(error, "ReadDocument", `Failed to read item ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
