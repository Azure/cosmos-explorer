import { CollectionBase } from "../../Contracts/ViewModels";
import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import DocumentId from "../../Explorer/Tree/DocumentId";

export const deleteDocument = async (collection: CollectionBase, documentId: DocumentId): Promise<void> => {
  const entityName: string = getEntityName();
  const clearMessage = logConsoleProgress(`Deleting ${entityName} ${documentId.id()}`);

  try {
    await client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), documentId.partitionKeyValue)
      .delete();
    logConsoleInfo(`Successfully deleted ${entityName} ${documentId.id()}`);
  } catch (error) {
    handleError(error, "DeleteDocument", `Error while deleting ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
