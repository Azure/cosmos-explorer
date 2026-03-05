import { TriggerDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { createUpdateSqlTrigger, getSqlTrigger } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { SqlTriggerCreateUpdateParameters, SqlTriggerResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function createTrigger(
  databaseId: string,
  collectionId: string,
  trigger: SqlTriggerResource,
): Promise<TriggerDefinition | SqlTriggerResource> {
  const clearMessage = logConsoleProgress(`Creating trigger ${trigger.id}`);
  try {
    let resource: SqlTriggerResource | TriggerDefinition;
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      try {
        const getResponse = await getSqlTrigger(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          trigger.id,
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
          resource: trigger,
          options: {},
        },
      };
      const rpResponse = await createUpdateSqlTrigger(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        trigger.id,
        createTriggerParams,
      );
      resource = rpResponse && rpResponse.properties?.resource;
    } else {
      const sdkResponse = await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.triggers.create(trigger as unknown as TriggerDefinition); // TODO: TypeScript does not like the SQL SDK trigger type
      resource = sdkResponse.resource;
    }
    logConsoleInfo(`Successfully created trigger ${trigger.id}`);
    return resource;
  } catch (error) {
    handleError(error, "CreateTrigger", `Error while creating trigger ${trigger.id}`);
    throw error;
  } finally {
    clearMessage();
  }
}
