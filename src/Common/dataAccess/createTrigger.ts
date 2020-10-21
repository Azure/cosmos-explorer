import { AuthType } from "../../AuthType";
import { Resource, TriggerDefinition } from "@azure/cosmos";
import {
  SqlTriggerCreateUpdateParameters,
  SqlTriggerResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import { createUpdateSqlTrigger, getSqlTrigger } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function createTrigger(
  databaseId: string,
  collectionId: string,
  trigger: TriggerDefinition
): Promise<TriggerDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating trigger ${trigger.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      try {
        const getResponse = await getSqlTrigger(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          trigger.id
        );
        if (getResponse?.properties?.resource) {
          throw new Error(`Create trigger failed: ${trigger.id} already exists`);
        }
      } catch (error) {
        if (error.code !== "NotFound") {
          throw error;
        }
      }

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
      return rpResponse && (rpResponse.properties?.resource as TriggerDefinition & Resource);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.triggers.create(trigger);
    return response.resource;
  } catch (error) {
    logConsoleError(`Error while creating trigger ${trigger.id}:\n ${error.message}`);
    logError(error.message, "CreateTrigger", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
