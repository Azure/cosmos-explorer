import { QueryResults } from "../../Contracts/ViewModels";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { MinimalQueryIterator, nextPage } from "../IteratorUtilities";

// Redact sensitive information from BadRequest errors with specific codes
export const redactSyntaxErrorMessage = (error: unknown): unknown => {
  const codesToRedact = ["SC1001", "SC2001", "SC1010"];

  try {
    // Handle error objects with a message property
    if (error && typeof error === "object" && "message" in error) {
      const errorObj = error as { code?: string; message?: string };
      if (typeof errorObj.message === "string") {
        // Parse the inner JSON from the message
        const innerJson = JSON.parse(errorObj.message);
        if (innerJson.code === "BadRequest" && typeof innerJson.message === "string") {
          const [innerErrorsJson, activityIdPart] = innerJson.message.split("\r\n");
          const innerErrorsObj = JSON.parse(innerErrorsJson);
          if (Array.isArray(innerErrorsObj.errors)) {
            let modified = false;
            innerErrorsObj.errors = innerErrorsObj.errors.map((err: { code?: string; message?: string }) => {
              if (err.code && codesToRedact.includes(err.code)) {
                modified = true;
                return { ...err, message: "__REDACTED__" };
              }
              return err;
            });

            if (modified) {
              // Reconstruct the message with the redacted content
              const redactedMessage = JSON.stringify(innerErrorsObj) + `\r\n${activityIdPart}`;
              const redactedError = {
                ...error,
                message: JSON.stringify({ ...innerJson, message: redactedMessage }),
                body: undefined as unknown, // Clear body to avoid sensitive data
              };
              return redactedError;
            }
          }
        }
      }
    }
  } catch {
    // If parsing fails, return the original error
  }

  return error;
};

export const queryDocumentsPage = async (
  resourceName: string,
  documentsIterator: MinimalQueryIterator,
  firstItemIndex: number,
): Promise<QueryResults> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Querying ${entityName} for container ${resourceName}`);

  try {
    const result: QueryResults = await nextPage(documentsIterator, firstItemIndex);
    const itemCount = (result.documents && result.documents.length) || 0;
    logConsoleInfo(`Successfully fetched ${itemCount} ${entityName} for container ${resourceName}`);
    return result;
  } catch (error) {
    // Redact sensitive information for telemetry while showing original in console
    const redactedError = redactSyntaxErrorMessage(error);

    handleError(error, "QueryDocumentsPage", `Failed to query ${entityName} for container ${resourceName}`, {
      redactedError: redactedError as Error,
    });
    throw error;
  } finally {
    clearMessage();
  }
};
