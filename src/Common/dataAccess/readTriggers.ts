import { AuthType } from "../../AuthType";
import { Resource, TriggerDefinition } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { listSqlTriggers } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function readTriggers(
  databaseId: string,
  collectionId: string
): Promise<(TriggerDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying triggers for container ${collectionId}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
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
    logConsoleError(`Failed to query triggers for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadTriggers", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
