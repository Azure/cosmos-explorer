import { AuthType } from "../../AuthType";
import { client } from "../CosmosClient";
import { deleteSqlTrigger } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function deleteTrigger(databaseId: string, collectionId: string, triggerId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting trigger ${triggerId}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      await deleteSqlTrigger(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        triggerId
      );
    } else {
      await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.trigger(triggerId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting trigger ${triggerId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteTrigger", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
