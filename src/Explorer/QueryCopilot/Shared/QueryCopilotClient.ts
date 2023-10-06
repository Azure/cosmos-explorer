import { FeedOptions } from "@azure/cosmos";
import {
  ContainerStatusType,
  PoolIdType,
  QueryCopilotSampleContainerId,
  QueryCopilotSampleContainerSchema,
  ShortenedQueryCopilotSampleContainerSchema,
} from "Common/Constants";
import { getErrorMessage, handleError } from "Common/ErrorHandlingUtils";
import { shouldEnableCrossPartitionKey } from "Common/HeadersUtility";
import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { createUri } from "Common/UrlUtility";
import { queryDocumentsPage } from "Common/dataAccess/queryDocumentsPage";
import { QueryResults } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { querySampleDocuments } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { FeedbackParams, GenerateSQLQueryResponse } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";
import * as StringUtility from "../../../Shared/StringUtility";

export const SendQueryRequest = async ({
  userPrompt,
  explorer,
}: {
  userPrompt: string;
  explorer: Explorer;
}): Promise<void> => {
  if (userPrompt.trim() !== "") {
    useQueryCopilot
      .getState()
      .setChatMessages([...useQueryCopilot.getState().chatMessages, { source: 0, message: userPrompt }]);
    useQueryCopilot.getState().setIsGeneratingQuery(true);
    useQueryCopilot.getState().setShouldIncludeInMessages(true);
    useTabs.getState().setIsTabExecuting(true);
    useTabs.getState().setIsQueryErrorThrown(false);
    try {
      if (
        useQueryCopilot.getState().containerStatus.status !== ContainerStatusType.Active &&
        !userContext.features.disableCopilotPhoenixGateaway
      ) {
        await explorer.allocateContainer(PoolIdType.QueryCopilot);
      }

      useQueryCopilot.getState().refreshCorrelationId();
      const serverInfo = useQueryCopilot.getState().notebookServerInfo;

      const queryUri = userContext.features.disableCopilotPhoenixGateaway
        ? createUri("https://copilotorchestrater.azurewebsites.net/", "generateSQLQuery")
        : createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery");

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
          const bubbleMessage = `Here is a query which will help you with provided prompt.\r\n **Prompt:** "${userPrompt}"`;
          if (useQueryCopilot.getState().shouldIncludeInMessages) {
            useQueryCopilot.getState().setChatMessages([
              ...useQueryCopilot.getState().chatMessages,
              {
                source: 1,
                message: bubbleMessage,
                sqlQuery: generateSQLQueryResponse.sql,
                explanation: generateSQLQueryResponse.explanation,
              },
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
      !userContext.features.disableCopilotPhoenixGateaway
    ) {
      await explorer.allocateContainer(PoolIdType.QueryCopilot);
    }
    const serverInfo = useQueryCopilot.getState().notebookServerInfo;
    const feedbackUri = userContext.features.disableCopilotPhoenixGateaway
      ? createUri("https://copilotorchestrater.azurewebsites.net/", "feedback")
      : createUri(serverInfo.notebookServerEndpoint, "feedback");
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

export const OnExecuteQueryClick = async (): Promise<void> => {
  traceStart(Action.ExecuteQueryGeneratedFromQueryCopilot, {
    correlationId: useQueryCopilot.getState().correlationId,
    userPrompt: useQueryCopilot.getState().userPrompt,
    generatedQuery: useQueryCopilot.getState().generatedQuery,
    generatedQueryComments: useQueryCopilot.getState().generatedQueryComments,
    executedQuery: useQueryCopilot.getState().selectedQuery || useQueryCopilot.getState().query,
  });
  const queryToExecute = useQueryCopilot.getState().selectedQuery || useQueryCopilot.getState().query;
  const queryIterator = querySampleDocuments(queryToExecute, {
    enableCrossPartitionQuery: shouldEnableCrossPartitionKey(),
  } as FeedOptions);
  useQueryCopilot.getState().setQueryIterator(queryIterator);

  setTimeout(async () => {
    await QueryDocumentsPerPage(0, queryIterator);
  }, 100);
};

export const QueryDocumentsPerPage = async (
  firstItemIndex: number,
  queryIterator: MinimalQueryIterator,
): Promise<void> => {
  try {
    useQueryCopilot.getState().setIsExecuting(true);
    useTabs.getState().setIsTabExecuting(true);
    useTabs.getState().setIsQueryErrorThrown(false);
    const queryResults: QueryResults = await queryPagesUntilContentPresent(
      firstItemIndex,
      async (firstItemIndex: number) =>
        queryDocumentsPage(QueryCopilotSampleContainerId, queryIterator, firstItemIndex),
    );

    useQueryCopilot.getState().setQueryResults(queryResults);
    useQueryCopilot.getState().setErrorMessage("");
    useQueryCopilot.getState().setShowErrorMessageBar(false);
    traceSuccess(Action.ExecuteQueryGeneratedFromQueryCopilot, {
      correlationId: useQueryCopilot.getState().correlationId,
    });
  } catch (error) {
    const isCopilotActive = StringUtility.toBoolean(
      localStorage.getItem(`${userContext.databaseAccount?.id}-queryCopilotToggleStatus`),
    );
    const errorMessage = getErrorMessage(error);
    traceFailure(Action.ExecuteQueryGeneratedFromQueryCopilot, {
      correlationId: useQueryCopilot.getState().correlationId,
      errorMessage: errorMessage,
    });
    handleError(errorMessage, "executeQueryCopilotTab");
    useTabs.getState().setIsQueryErrorThrown(true);
    if (isCopilotActive) {
      useQueryCopilot.getState().setErrorMessage(errorMessage);
      useQueryCopilot.getState().setShowErrorMessageBar(true);
    }
  } finally {
    useQueryCopilot.getState().setIsExecuting(false);
    useTabs.getState().setIsTabExecuting(false);
  }
};
