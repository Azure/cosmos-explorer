import { Item, RequestOptions } from "@azure/cosmos";
import { HttpHeaders } from "Common/Constants";
import { CollectionBase } from "../../Contracts/ViewModels";
import DocumentId from "../../Explorer/Tree/DocumentId";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { getPartitionKeyValue } from "./getPartitionKeyValue";

export const updateDocument = async (
  collection: CollectionBase,
  documentId: DocumentId,
  newDocument: Item,
): Promise<Item> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Updating ${entityName} ${documentId.id()}`);

  try {
    const options: RequestOptions =
      documentId.partitionKey.kind === "MultiHash"
        ? {
            [HttpHeaders.partitionKey]: documentId.partitionKeyValue,
          }
        : {};
    const response = await client()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), getPartitionKeyValue(documentId))
      .replace(newDocument, options);

    logConsoleInfo(`Successfully updated ${entityName} ${documentId.id()}`);
    return response?.resource;
  } catch (error) {
    console.log(`Caught in client update call.`);
    console.log(error);
    handleError(error, "UpdateDocument", `Failed to update ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
