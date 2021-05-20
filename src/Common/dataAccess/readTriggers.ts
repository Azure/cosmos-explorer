import { Resource, TriggerDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { listSqlTriggers } from "../../Utils/arm/generatedClients/cosmos/2021-04-15/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readTriggers(
  databaseId: string,
  collectionId: string
): Promise<(TriggerDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying triggers for container ${collectionId}`);
  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations && userContext.apiType === "SQL") {
      const rpResponse = await listSqlTriggers(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      return rpResponse?.value?.map((trigger) => trigger.properties?.resource as TriggerDefinition & Resource);
    }

    const response = await client().database(databaseId).container(collectionId).scripts.triggers.readAll().fetchAll();
    return response?.resources;
  } catch (error) {
    handleError(error, "ReadTriggers", `Failed to query triggers for container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
