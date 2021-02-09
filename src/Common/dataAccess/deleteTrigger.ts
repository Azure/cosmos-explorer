import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { deleteSqlTrigger } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";

export async function deleteTrigger(databaseId: string, collectionId: string, triggerId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting trigger ${triggerId}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      await deleteSqlTrigger(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        triggerId
      );
    } else {
      await client().database(databaseId).container(collectionId).scripts.trigger(triggerId).delete();
    }
  } catch (error) {
    handleError(error, "DeleteTrigger", `Error while deleting trigger ${triggerId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
