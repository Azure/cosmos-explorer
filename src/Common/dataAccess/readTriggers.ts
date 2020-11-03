import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { Resource, TriggerDefinition } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { listSqlTriggers } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";
import { handleError } from "../ErrorHandlingUtils";

export async function readTriggers(
  databaseId: string,
  collectionId: string
): Promise<(TriggerDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying triggers for container ${collectionId}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      const rpResponse = await listSqlTriggers(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      return rpResponse?.value?.map(trigger => trigger.properties?.resource as TriggerDefinition & Resource);
    }

    const response = await client()
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
