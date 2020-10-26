import * as DataModels from "../../Contracts/DataModels";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .read();
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    handleError(error, `Error while querying container ${collectionId}`, "ReadCollection");
    throw error;
  }
  clearMessage();
  return collection;
}
