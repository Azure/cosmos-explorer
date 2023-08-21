import { QueryCopilotSampleContainerSchema, ShortenedQueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { FeedbackParams } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";

export const SendQueryRequest = async (userPrompt: string): Promise<Response> => {
  let response: Response;
  try {
    useQueryCopilot.getState().refreshCorrelationId();
    const serverInfo = useNotebook.getState().notebookServerInfo;
    const queryUri = createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery");
    const payload = {
      containerSchema: ShortenedQueryCopilotSampleContainerSchema,
      userPrompt: userPrompt,
    };
    response = await fetch(queryUri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-correlationid": useQueryCopilot.getState().correlationId,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    handleError(error, "executeNaturalLanguageQuery");
    throw error;
  }

  return response;
};

export const SubmitFeedback = async ({
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
