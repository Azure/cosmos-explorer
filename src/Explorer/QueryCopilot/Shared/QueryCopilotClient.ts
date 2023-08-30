import {
  ContainerStatusType,
  PoolIdType,
  QueryCopilotSampleContainerSchema,
  ShortenedQueryCopilotSampleContainerSchema,
} from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import Explorer from "Explorer/Explorer";
import { FeedbackParams, GenerateSQLQueryResponse } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";

export const SendQueryRequest = async ({
  userPrompt,
  explorer,
}: {
  userPrompt: string;
  explorer: Explorer;
}): Promise<void> => {
  if (userPrompt.trim() !== "") {
    useQueryCopilot.getState().setIsGeneratingQuery(true);
    useQueryCopilot.getState().setShouldIncludeInMessages(true);
    useQueryCopilot.getState().setShowQueryExplanation(false);
    useQueryCopilot.getState().setShowExplanationBubble(false);
    useTabs.getState().setIsTabExecuting(true);
    useTabs.getState().setIsQueryErrorThrown(false);
    useQueryCopilot
      .getState()
      .setChatMessages([...useQueryCopilot.getState().chatMessages, { source: 0, message: userPrompt }]);
    try {
      if (
        useQueryCopilot.getState().containerStatus.status !== ContainerStatusType.Active &&
        userContext.features.enableCopilotPhoenixGateaway
      ) {
        await explorer.allocateContainer(PoolIdType.QueryCopilot);
      }

      useQueryCopilot.getState().refreshCorrelationId();
      const serverInfo = useQueryCopilot.getState().notebookServerInfo;

      const queryUri = userContext.features.enableCopilotPhoenixGateaway
        ? createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery")
        : createUri("https://copilotorchestrater.azurewebsites.net/", "generateSQLQuery");

      const payload = {
        containerSchema: userContext.features.enableCopilotFullSchema
          ? QueryCopilotSampleContainerSchema
          : ShortenedQueryCopilotSampleContainerSchema,
        userPrompt: userPrompt,
      };
      const response = await fetch(queryUri, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ms-correlationid": useQueryCopilot.getState().correlationId,
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (response.ok) {
        if (generateSQLQueryResponse?.sql) {
          let query = `Here is a query which will help you with provided prompt.\r\n **Prompt:** ${userPrompt}`;
          query += `\r\n${generateSQLQueryResponse.sql}`;
          if (useQueryCopilot.getState().shouldIncludeInMessages) {
            useQueryCopilot
              .getState()
              .setChatMessages([
                ...useQueryCopilot.getState().chatMessages,
                { source: 1, message: query, explanation: generateSQLQueryResponse.explanation },
              ]);
            useQueryCopilot.getState().setShowExplanationBubble(true);
            useQueryCopilot.getState().setGeneratedQuery(generateSQLQueryResponse.sql);
            useQueryCopilot.getState().setGeneratedQueryComments(generateSQLQueryResponse.explanation);
          }
        }
      } else {
        handleError(JSON.stringify(generateSQLQueryResponse), "copilotInternalServerError");
        useTabs.getState().setIsQueryErrorThrown(true);
      }
    } catch (error) {
      handleError(error, "executeNaturalLanguageQuery");
      useTabs.getState().setIsQueryErrorThrown(true);
      throw error;
    } finally {
      useQueryCopilot.getState().setUserPrompt("");
      useQueryCopilot.getState().setIsGeneratingQuery(false);
      useTabs.getState().setIsTabExecuting(false);
    }
  }
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
    if (
      useQueryCopilot.getState().containerStatus.status !== ContainerStatusType.Active &&
      userContext.features.enableCopilotPhoenixGateaway
    ) {
      await explorer.allocateContainer(PoolIdType.QueryCopilot);
    }
    const serverInfo = useQueryCopilot.getState().notebookServerInfo;
    const feedbackUri = userContext.features.enableCopilotPhoenixGateaway
      ? createUri(serverInfo.notebookServerEndpoint, "feedback")
      : createUri("https://copilotorchestrater.azurewebsites.net/", "feedback");
    await fetch(feedbackUri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-correlationid": useQueryCopilot.getState().correlationId,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    handleError(error, "copilotSubmitFeedback");
  }
};
