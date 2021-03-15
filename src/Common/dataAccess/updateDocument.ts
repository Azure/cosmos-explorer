import { Item } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import DocumentId from "../../Explorer/Tree/DocumentId";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";

export const updateDocument = async (
  collection: CollectionBase,
  documentId: DocumentId,
  newDocument: Item
): Promise<Item> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Updating ${entityName} ${documentId.id()}`);

  try {
    const response = await client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), documentId.partitionKeyValue)
      .replace(newDocument);

    logConsoleInfo(`Successfully updated ${entityName} ${documentId.id()}`);
    return response?.resource;
  } catch (error) {
    handleError(error, "UpdateDocument", `Failed to update ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
