import { TriggerDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { createUpdateSqlTrigger, getSqlTrigger } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { SqlTriggerCreateUpdateParameters, SqlTriggerResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { ClientOperationType, client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function updateTrigger(
  databaseId: string,
  collectionId: string,
  trigger: SqlTriggerResource,
): Promise<SqlTriggerResource | TriggerDefinition> {
  const clearMessage = logConsoleProgress(`Updating trigger ${trigger.id}`);
  const { authType, apiType, subscriptionId, resourceGroup, databaseAccount } = userContext;
  try {
    if (authType === AuthType.AAD && !userContext.features.enableSDKoperations && apiType === "SQL") {
      const getResponse = await getSqlTrigger(
        subscriptionId,
        resourceGroup,
        databaseAccount.name,
        databaseId,
        collectionId,
        trigger.id,
      );

      if (getResponse?.properties?.resource) {
        const createTriggerParams: SqlTriggerCreateUpdateParameters = {
          properties: {
            resource: trigger,
            options: {},
          },
        };
        const rpResponse = await createUpdateSqlTrigger(
          subscriptionId,
          resourceGroup,
          databaseAccount.name,
          databaseId,
          collectionId,
          trigger.id,
          createTriggerParams,
        );
        return rpResponse && rpResponse.properties?.resource;
      }

      throw new Error(`Failed to update trigger: ${trigger.id} does not exist.`);
    }

    const response = await client(ClientOperationType.WRITE)
      .database(databaseId)
      .container(collectionId)
      .scripts.trigger(trigger.id)
      .replace(trigger as unknown as TriggerDefinition); // TODO: TypeScript does not like the SQL SDK trigger type
    return response?.resource;
  } catch (error) {
    handleError(error, "UpdateTrigger", `Error while updating trigger ${trigger.id}`);
    throw error;
  } finally {
    clearMessage();
  }
}
