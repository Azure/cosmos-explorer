import { BulkOperationType, OperationInput } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import DocumentId from "../../Explorer/Tree/DocumentId";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { getPartitionKeyValue } from "./getPartitionKeyValue";

export const deleteDocument = async (collection: CollectionBase, documentId: DocumentId): Promise<void> => {
  const entityName: string = getEntityName();
  const clearMessage = logConsoleProgress(`Deleting ${entityName} ${documentId.id()}`);

  try {
    await client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), getPartitionKeyValue(documentId))
      .delete();
    logConsoleInfo(`Successfully deleted ${entityName} ${documentId.id()}`);
  } catch (error) {
    handleError(error, "DeleteDocument", `Error while deleting ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};

export interface IBulkDeleteResult {
  documentId: DocumentId;
  requestCharge: number;
  statusCode: number;
  retryAfterMilliseconds?: number;
}

/**
 * Bulk delete documents
 * @param collection
 * @param documentId
 * @returns array of results and status codes
 */
export const deleteDocuments = async (
  collection: CollectionBase,
  documentIds: DocumentId[],
  abortSignal: AbortSignal,
): Promise<IBulkDeleteResult[]> => {
  const totalCount = documentIds.length;
  const clearMessage = logConsoleProgress(`Deleting ${totalCount} ${getEntityName(true)}`);
  try {
    const v2Container = await client().database(collection.databaseId).container(collection.id());

    // Bulk can only delete 100 documents at a time
    const BULK_DELETE_LIMIT = 100;
    const promiseArray = [];

    while (documentIds.length > 0) {
      const documentIdsChunk = documentIds.splice(0, BULK_DELETE_LIMIT);
      const operations: OperationInput[] = documentIdsChunk.map((documentId) => ({
        id: documentId.id(),
        // bulk delete: if not partition key is specified, do not pass empty array, but undefined
        partitionKey:
          documentId.partitionKeyValue &&
          Array.isArray(documentId.partitionKeyValue) &&
          documentId.partitionKeyValue.length === 0
            ? undefined
            : documentId.partitionKeyValue,
        operationType: BulkOperationType.Delete,
      }));

      const promise = v2Container.items
        .bulk(operations, undefined, {
          abortSignal,
        })
        .then((bulkResults) => {
          return bulkResults.map((bulkResult, index) => {
            const documentId = documentIdsChunk[index];
            return { ...bulkResult, documentId };
          });
        });
      promiseArray.push(promise);
    }

    const allResult = await Promise.all(promiseArray);
    const flatAllResult = Array.prototype.concat.apply([], allResult);
    return flatAllResult;
  } catch (error) {
    handleError(
      error,
      "DeleteDocuments",
      `Error while deleting ${totalCount} ${getEntityName(totalCount > 1)}`,
    );
    throw error;
  } finally {
    clearMessage();
  }
};
