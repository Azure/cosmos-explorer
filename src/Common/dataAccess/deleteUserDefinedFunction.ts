import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { deleteSqlUserDefinedFunction } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function deleteUserDefinedFunction(databaseId: string, collectionId: string, id: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting user defined function ${id}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      await deleteSqlUserDefinedFunction(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        id
      );
    } else {
      await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.userDefinedFunction(id)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting user defined function ${id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteUserDefinedFunction", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
