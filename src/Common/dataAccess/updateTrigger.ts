import { AuthType } from "../../AuthType";
import {
  SqlTriggerCreateUpdateParameters,
  SqlTriggerResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { TriggerDefinition } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { createUpdateSqlTrigger, getSqlTrigger } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function updateTrigger(
  databaseId: string,
  collectionId: string,
  trigger: TriggerDefinition
): Promise<TriggerDefinition> {
  const clearMessage = logConsoleProgress(`Updating trigger ${trigger.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      const getResponse = await getSqlTrigger(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        trigger.id
      );

      if (getResponse?.properties?.resource) {
        const createTriggerParams: SqlTriggerCreateUpdateParameters = {
          properties: {
            resource: trigger as SqlTriggerResource,
            options: {}
          }
        };
        const rpResponse = await createUpdateSqlTrigger(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          trigger.id,
          createTriggerParams
        );
        return rpResponse && (rpResponse.properties?.resource as TriggerDefinition);
      }

      throw new Error(`Failed to update trigger: ${trigger.id} does not exist.`);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.trigger(trigger.id)
      .replace(trigger);
    return response?.resource;
  } catch (error) {
    const errorMessage = error.code === "NotFound" ? `${trigger.id} does not exist.` : JSON.stringify(error);
    logConsoleError(`Error while updating trigger ${trigger.id}:\n ${errorMessage}`);
    logError(errorMessage, "UpdateTrigger", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
