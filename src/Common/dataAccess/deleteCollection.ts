import { AuthType } from "../../AuthType";
import { deleteSqlContainer } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";
import { client } from "../CosmosClient";
import { refreshCachedResources } from "../DataAccessUtilityBase";

export async function deleteCollection(databaseId: string, collectionId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting container ${collectionId}`);
  try {
    if (window.authType === AuthType.AAD) {
      await deleteSqlContainer(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
    } else {
      await client()
        .database(databaseId)
        .container(collectionId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting container ${collectionId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  logConsoleInfo(`Successfully deleted container ${collectionId}`);
  clearMessage();
  await refreshCachedResources();
}
