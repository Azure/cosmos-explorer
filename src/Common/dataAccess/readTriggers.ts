import { TriggerDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { listSqlTriggers } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { SqlTriggerResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { ClientOperationType, client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readTriggers(
  databaseId: string,
  collectionId: string,
): Promise<SqlTriggerResource[] | TriggerDefinition[]> {
  const clearMessage = logConsoleProgress(`Querying triggers for container ${collectionId}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      const rpResponse = await listSqlTriggers(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
      );
      return rpResponse?.value?.map((trigger) => trigger.properties?.resource);
    }

    const response = await client(ClientOperationType.READ)
      .database(databaseId)
      .container(collectionId)
      .scripts.triggers.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    handleError(error, "ReadTriggers", `Failed to query triggers for container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
