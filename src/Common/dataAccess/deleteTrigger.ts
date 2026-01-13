import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { deleteSqlTrigger } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function deleteTrigger(databaseId: string, collectionId: string, triggerId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting trigger ${triggerId}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      await deleteSqlTrigger(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        triggerId,
      );
    } else {
      await client().database(databaseId).container(collectionId).scripts.trigger(triggerId).delete();
    }
    logConsoleProgress(`Successfully deleted trigger ${triggerId}`);
  } catch (error) {
    handleError(error, "DeleteTrigger", `Error while deleting trigger ${triggerId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
