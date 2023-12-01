import { FeedOptions, Item, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import { getPartitionKeyValue } from "Common/dataAccess/getPartitionKeyValue";
import { getCommonQueryOptions } from "Common/dataAccess/queryDocuments";
import DocumentId from "Explorer/Tree/DocumentId";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";

export interface SuggestedPrompt {
  id: number;
  text: string;
}

export const querySampleDocuments = (query: string, options: FeedOptions): QueryIterator<ItemDefinition & 
Resource> => {
  options = getCommonQueryOptions(options);
  return sampleDataClient()
    .database(QueryCopilotSampleDatabaseId)
    .container(QueryCopilotSampleContainerId)
    .items.query(query, options);
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

export const getSampleDatabaseSuggestedPrompts = (): SuggestedPrompt[] => {
  return [
    { id: 1, text: 'Show all products that have the word "ultra" in the name or description' },
    { id: 2, text: "What are all of the possible categories for the products, and their counts?" },
    { id: 3, text: 'Show me all products that have been reviewed by someone with a username that contains "bob"' },
  ];
};

export const getSuggestedPrompts = (): SuggestedPrompt[] => {
  return [
    { id: 1, text: "Show the first 10 items" },
    { id: 2, text: 'Count all the items in my data as "numItems"' },
    { id: 3, text: "Find the oldest item added to my collection" },
  ];
};
