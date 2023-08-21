import { FeedOptions, Item, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import {
  QueryCopilotSampleContainerId,
  QueryCopilotSampleContainerSchema,
  QueryCopilotSampleDatabaseId,
} from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import { createUri } from "Common/UrlUtility";
import { getPartitionKeyValue } from "Common/dataAccess/getPartitionKeyValue";
import { getCommonQueryOptions } from "Common/dataAccess/queryDocuments";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { FeedbackParams } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import DocumentId from "Explorer/Tree/DocumentId";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";

export const submitFeedback = async ({
  params,
  explorer,
}: {
  params: FeedbackParams;
  explorer: Explorer;
}): Promise<void> => {
  try {
    const { likeQuery, generatedQuery, userPrompt, description, contact } = params;
    const { correlationId, shouldAllocateContainer, setShouldAllocateContainer } = useQueryCopilot();
    const payload = {
      containerSchema: QueryCopilotSampleContainerSchema,
      like: likeQuery ? "like" : "dislike",
      generatedSql: generatedQuery,
      userPrompt,
      description: description || "",
      contact: contact || "",
    };
    if (shouldAllocateContainer) {
      await explorer.allocateContainer();
      setShouldAllocateContainer(false);
    }
    const serverInfo = useNotebook.getState().notebookServerInfo;
    const feedbackUri = createUri(serverInfo.notebookServerEndpoint, "feedback");
    const response = await fetch(feedbackUri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-correlationid": correlationId,
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 404) {
      setShouldAllocateContainer(true);
    }
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
