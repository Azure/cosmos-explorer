import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { useQueryCopilot } from "hooks/useQueryCopilot";

export const sendQueryRequest = async (payload: {}): Promise<Response> => {
  let response: Response;
  try {
    useQueryCopilot.getState().refreshCorrelationId();
    const serverInfo = useNotebook.getState().notebookServerInfo;
    const queryUri = createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery");
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
