import { CosmosClient } from "../CosmosClient";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { logConsoleProgress, logConsoleInfo, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { AuthType } from "../../AuthType";
import { deleteSqlContainer } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";

export async function deleteCollection(databaseId: string, collectionId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting container ${collectionId}`);
  try {
    if (window.authType === AuthType.AAD) {
      await deleteSqlContainer(
        CosmosClient.subscriptionId(),
        CosmosClient.resourceGroup(),
        CosmosClient.databaseAccount().name,
        databaseId,
        collectionId
      );
    } else {
      await CosmosClient.client()
        .database(databaseId)
        .container(collectionId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting container ${collectionId}:\n ${JSON.stringify(error)}`);
    throw error;
  }
  logConsoleInfo(`Successfully deleted container ${collectionId}`);
  clearMessage();
  await refreshCachedResources();
}
