import { QueryOperationOptions } from "@azure/cosmos";
import { QueryResults } from "../../Contracts/ViewModels";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { MinimalQueryIterator, nextPage } from "../IteratorUtilities";

export const queryDocumentsPage = async (
  resourceName: string,
  documentsIterator: MinimalQueryIterator,
  firstItemIndex: number,
  queryOperationOptions?: QueryOperationOptions,
): Promise<QueryResults> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Querying ${entityName} for container ${resourceName}`);

  try {
    const result: QueryResults = await nextPage(documentsIterator, firstItemIndex, queryOperationOptions);
    const itemCount = (result.documents && result.documents.length) || 0;
    logConsoleInfo(`Successfully fetched ${itemCount} ${entityName} for container ${resourceName}`);
    return result;
  } catch (error) {
    handleError(error, "QueryDocumentsPage", `Failed to query ${entityName} for container ${resourceName}`);
    throw error;
  } finally {
    clearMessage();
  }
};
