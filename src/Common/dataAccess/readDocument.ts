import { Item } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import DocumentId from "../../Explorer/Tree/DocumentId";

export const readDocument = async (collection: CollectionBase, documentId: DocumentId): Promise<Item> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Reading ${entityName} ${documentId.id()}`);

  try {
    const response = await client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), documentId.partitionKeyValue)
      .read();

    return response?.resource;
  } catch (error) {
    handleError(error, "ReadDocument", `Failed to read ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
