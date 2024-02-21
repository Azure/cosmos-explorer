import { CollectionBase } from "../../Contracts/ViewModels";
import DocumentId from "../../Explorer/Tree/DocumentId";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ClientOperationType, client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { getPartitionKeyValue } from "./getPartitionKeyValue";

export const deleteDocument = async (collection: CollectionBase, documentId: DocumentId): Promise<void> => {
  const entityName: string = getEntityName();
  const clearMessage = logConsoleProgress(`Deleting ${entityName} ${documentId.id()}`);

  try {
    await client(ClientOperationType.WRITE)
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
