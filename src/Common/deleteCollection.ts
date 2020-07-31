import * as ViewModels from "../Contracts/ViewModels";
import { CosmosClient } from "./CosmosClient";
import { refreshCachedResources } from "./DataAccessUtilityBase";
import { logConsoleProgress, logConsoleInfo, logConsoleError } from "../Utils/NotificationConsoleUtils";
import { AuthType } from "../AuthType";
import { deleteSqlContainer } from "../Utils/arm/generatedClients/2020-04-01/sqlResources";

export async function deleteCollection(collection: ViewModels.Collection): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting container ${collection.id()}`);
  try {
    if (window.authType === AuthType.AAD) {
      await deleteSqlContainer(
        CosmosClient.subscriptionId(),
        CosmosClient.resourceGroup(),
        CosmosClient.databaseAccount().name,
        collection.databaseId,
        collection.id()
      );
    } else {
      await CosmosClient.client()
        .database(collection.databaseId)
        .container(collection.id())
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting container ${collection.id()}:\n ${JSON.stringify(error)}`);
    throw error;
  }
  logConsoleInfo(`Successfully deleted container ${collection.id()}`);
  clearMessage();
  await refreshCachedResources();
}
