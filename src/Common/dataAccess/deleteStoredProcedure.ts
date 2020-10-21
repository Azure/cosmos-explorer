import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { deleteSqlStoredProcedure } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function deleteStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedureId: string
): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting stored procedure ${storedProcedureId}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      await deleteSqlStoredProcedure(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedureId
      );
    } else {
      await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.storedProcedure(storedProcedureId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting stored procedure ${storedProcedureId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteStoredProcedure", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
