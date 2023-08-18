import { FeedOptions, Item, ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";
import {
  QueryCopilotSampleContainerId,
  QueryCopilotSampleContainerSchema,
  QueryCopilotSampleDatabaseId,
  ShortenedQueryCopilotSampleContainerSchema,
} from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import { createUri } from "Common/UrlUtility";
import { getPartitionKeyValue } from "Common/dataAccess/getPartitionKeyValue";
import { getCommonQueryOptions } from "Common/dataAccess/queryDocuments";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import DocumentId from "Explorer/Tree/DocumentId";
import { userContext } from "UserContext";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";

interface FeedbackParams {
  likeQuery: boolean;
  generatedQuery: string;
  userPrompt: string;
  description?: string;
  contact?: string;
}

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
      containerSchema: userContext.features.enableCopilotFullSchema
        ? QueryCopilotSampleContainerSchema
        : ShortenedQueryCopilotSampleContainerSchema,
      like: likeQuery ? "like" : "dislike",
      generatedSql: generatedQuery,
      userPrompt,
      description: description || "",
      contact: contact || "",
    };
    if (shouldAllocateContainer && userContext.features.enableCopilotPhoenixGateaway) {
      await explorer.allocateContainer();
      setShouldAllocateContainer(false);
    }
    const serverInfo = useNotebook.getState().notebookServerInfo;
    const feedbackUri = userContext.features.enableCopilotPhoenixGateaway
      ? createUri(serverInfo.notebookServerEndpoint, "feedback")
      : createUri("https://copilotorchestrater.azurewebsites.net/", "feedback");
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
