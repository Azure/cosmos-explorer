import { AuthType } from "../../AuthType";
import { deleteSqlDatabase } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";
import { client } from "../CosmosClient";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteDatabase(databaseId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting database ${databaseId}`);

  try {
    if (window.authType === AuthType.AAD) {
      await deleteSqlDatabase(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId
      );
    } else {
      await client()
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
