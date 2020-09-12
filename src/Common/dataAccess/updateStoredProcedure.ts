import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function updateStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition
): Promise<StoredProcedureDefinition & Resource> {
  let updatedStoredProcedure: StoredProcedureDefinition & Resource;
  const clearMessage = logConsoleProgress(`Updating stored procedure ${storedProcedure.id}`);
  try {
    const repsonse = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedure(storedProcedure.id)
      .replace(storedProcedure);
    updatedStoredProcedure = repsonse.resource;
  } catch (error) {
    logConsoleError(`Error while updating stored procedure ${storedProcedure.id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "UpdateStoredProcedure", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return updatedStoredProcedure;
}
