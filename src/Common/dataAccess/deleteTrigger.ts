import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteTrigger(databaseId: string, collectionId: string, triggerId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting trigger ${triggerId}`);
  try {
    await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.trigger(triggerId)
      .delete();
  } catch (error) {
    logConsoleError(`Error while deleting trigger ${triggerId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteTrigger", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return undefined;
}
