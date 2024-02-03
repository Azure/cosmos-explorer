import { Item, RequestOptions } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import DocumentId from "../../Explorer/Tree/DocumentId";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { HttpHeaders } from "../Constants";
// import { client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";
import { client2 } from "../ReadRegionCosmosClient";
import { getPartitionKeyValue } from "./getPartitionKeyValue";

export const readDocument = async (collection: CollectionBase, documentId: DocumentId): Promise<Item> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Reading ${entityName} ${documentId.id()}`);

  try {
    const options: RequestOptions =
      documentId.partitionKey.kind === "MultiHash"
        ? {
            [HttpHeaders.partitionKey]: documentId.partitionKeyValue,
          }
        : {};
    // const response = await client()
    //   .database(collection.databaseId)
    //   .container(collection.id())
    //   .item(documentId.id(), getPartitionKeyValue(documentId))
    //   .read(options);

    const response = await client2()
      .database(collection.databaseId)
      .container(collection.id())
      .item(documentId.id(), getPartitionKeyValue(documentId))
      .read(options);

    return response?.resource;
  } catch (error) {
    handleError(error, "ReadDocument", `Failed to read ${entityName} ${documentId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
