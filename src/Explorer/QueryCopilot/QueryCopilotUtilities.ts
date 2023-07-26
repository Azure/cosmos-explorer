import { FeedOptions, Item, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import {
  QueryCopilotSampleContainerId,
  QueryCopilotSampleContainerSchema,
  QueryCopilotSampleDatabaseId,
} from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import { getPartitionKeyValue } from "Common/dataAccess/getPartitionKeyValue";
import { getCommonQueryOptions } from "Common/dataAccess/queryDocuments";
import DocumentId from "Explorer/Tree/DocumentId";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";

interface FeedbackParams {
  likeQuery: boolean;
  generatedQuery: string;
  userPrompt: string;
  description?: string;
  contact?: string;
}

export const submitFeedback = async (params: FeedbackParams): Promise<void> => {
  try {
    const { likeQuery, generatedQuery, userPrompt, description, contact } = params;
    const payload = {
      containerSchema: QueryCopilotSampleContainerSchema,
      like: likeQuery ? "like" : "dislike",
      generatedSql: generatedQuery,
      userPrompt,
      description: description || "",
      contact: contact || "",
    };

    await fetch("https://copilotorchestrater.azurewebsites.net/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-correlationid": `${useQueryCopilot.getState().correlationId}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    handleError(error, "copilotSubmitFeedback");
  }
};

export const querySampleDocuments = (query: string, options: FeedOptions): QueryIterator<ItemDefinition & Resource> => {
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
