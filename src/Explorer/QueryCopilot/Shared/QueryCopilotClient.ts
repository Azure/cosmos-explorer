import { QueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { GenerateSQLQueryResponse } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";

export const handleSendQueryRequest = async ({ explorer }: { explorer: Explorer }): Promise<void> => {
  if (useQueryCopilot.getState().userPrompt.trim() !== "") {
    useQueryCopilot
      .getState()
      .setChatMessages([
        ...useQueryCopilot.getState().chatMessages,
        { source: 0, message: useQueryCopilot.getState().userPrompt },
      ]);
    useQueryCopilot.getState().setIsGeneratingQuery(true);
    try {
      if (useQueryCopilot.getState().shouldAllocateContainer) {
        await explorer.allocateContainer();
        useQueryCopilot.getState().setShouldAllocateContainer(false);
      }
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      const payload = {
        containerSchema: QueryCopilotSampleContainerSchema,
        userPrompt: useQueryCopilot.getState().userPrompt,
      };
      useQueryCopilot.getState().refreshCorrelationId();
      const serverInfo = useNotebook.getState().notebookServerInfo;
      const queryUri = createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery");
      console.log("Correlation ID ", useQueryCopilot.getState().correlationId);
      const response = await fetch(queryUri, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ms-correlationid": useQueryCopilot.getState().correlationId,
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (response.status === 404) {
        useQueryCopilot.getState().setShouldAllocateContainer(true);
      }
      if (response.ok) {
        if (generateSQLQueryResponse?.sql) {
          let query = `Here is a query which will help you with provided prompt.\r\n **Prompt:** ${
            useQueryCopilot.getState().userPrompt
          }`;
          query += `\r\n${generateSQLQueryResponse.sql}`;
          useQueryCopilot
            .getState()
            .setChatMessages([
              ...useQueryCopilot.getState().chatMessages,
              { source: 0, message: useQueryCopilot.getState().userPrompt },
              { source: 1, message: query, explanation: generateSQLQueryResponse.explanation },
            ]);
          useQueryCopilot.getState().setGeneratedQuery(generateSQLQueryResponse.sql);
          useQueryCopilot.getState().setGeneratedQueryComments(generateSQLQueryResponse.explanation);
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
