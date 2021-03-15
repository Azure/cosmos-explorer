import * as DataModels from "../../Contracts/DataModels";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
  try {
    const response = await client().database(databaseId).container(collectionId).read();
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    handleError(error, "ReadCollection", `Error while querying container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return collection;
}
