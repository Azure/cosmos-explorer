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

/**
 * Bulk delete documents
 * @param collection
 * @param documentId
 * @returns array of ids that were successfully deleted
 */
export const deleteDocuments = async (collection: CollectionBase, documentIds: DocumentId[]): Promise<DocumentId[]> => {
  const clearMessage = logConsoleProgress(`Deleting ${documentIds.length} ${getEntityName(true)}`);
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

      const promise = v2Container.items.bulk(operations).then((bulkResult) => {
        const result: DocumentId[] = [];
        documentIdsChunk.forEach((documentId, index) => {
          if (bulkResult[index].statusCode === 204) {
            result.push(documentId);
          }
        });
        return result;
      });
      promiseArray.push(promise);
    }

    const allResult = await Promise.all(promiseArray);
    const flatAllResult = Array.prototype.concat.apply([], allResult);
    logConsoleInfo(`Successfully deleted ${getEntityName(true)}: ${flatAllResult.length} out of ${documentIds.length}`);
    // TODO: handle case result.length != documentIds.length
    return flatAllResult;
  } catch (error) {
    handleError(error, "DeleteDocuments", `Error while deleting ${documentIds.length} ${getEntityName(true)}`);
    throw error;
  } finally {
    clearMessage();
  }
};
