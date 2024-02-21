import { CollectionBase } from "../../Contracts/ViewModels";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ClientOperationType, client } from "../CosmosClient";
import { getEntityName } from "../DocumentUtility";
import { handleError } from "../ErrorHandlingUtils";

export const createDocument = async (collection: CollectionBase, newDocument: unknown): Promise<unknown> => {
  const entityName = getEntityName();
  const clearMessage = logConsoleProgress(`Creating new ${entityName} for container ${collection.id()}`);

  try {
    const response = await client(ClientOperationType.WRITE)
      .database(collection.databaseId)
      .container(collection.id())
      .items.create(newDocument);

    logConsoleInfo(`Successfully created new ${entityName} for container ${collection.id()}`);
    return response?.resource;
  } catch (error) {
    handleError(error, "CreateDocument", `Error while creating new ${entityName} for container ${collection.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
