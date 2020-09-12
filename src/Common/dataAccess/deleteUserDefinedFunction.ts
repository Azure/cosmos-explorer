import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteUserDefinedFunction(databaseId: string, collectionId: string, id: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting user defined function ${id}`);
  try {
    await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunction(id)
      .delete();
  } catch (error) {
    logConsoleError(`Error while deleting user defined function ${id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteUserDefinedFunction", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return undefined;
}
