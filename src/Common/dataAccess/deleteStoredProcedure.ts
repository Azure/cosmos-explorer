import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedureId: string
): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting stored procedure ${storedProcedureId}`);
  try {
    await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedure(storedProcedureId)
      .delete();
  } catch (error) {
    logConsoleError(`Error while deleting stored procedure ${storedProcedureId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteStoredProcedure", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return undefined;
}
