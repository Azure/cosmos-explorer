import { CosmosClient } from "../CosmosClient";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { logConsoleProgress, logConsoleError, logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import { deleteSqlDatabase } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { AuthType } from "../../AuthType";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteDatabase(databaseId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting database ${databaseId}`);

  try {
    if (window.authType === AuthType.AAD) {
      await deleteSqlDatabase(
        CosmosClient.subscriptionId(),
        CosmosClient.resourceGroup(),
        CosmosClient.databaseAccount().name,
        databaseId
      );
    } else {
      await CosmosClient.client()
        .database(databaseId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting database ${databaseId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteDatabase", error.code);
    sendNotificationForError(error);
    throw error;
  }
  logConsoleInfo(`Successfully deleted database ${databaseId}`);
  clearMessage();
  await refreshCachedResources();
}
