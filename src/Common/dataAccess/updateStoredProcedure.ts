import { AuthType } from "../../AuthType";
import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import {
  SqlStoredProcedureCreateUpdateParameters,
  SqlStoredProcedureResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import {
  createUpdateSqlStoredProcedure,
  getSqlStoredProcedure
} from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function updateStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition
): Promise<StoredProcedureDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Updating stored procedure ${storedProcedure.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      const getResponse = await getSqlStoredProcedure(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedure.id
      );

      if (getResponse?.properties?.resource) {
        const createSprocParams: SqlStoredProcedureCreateUpdateParameters = {
          properties: {
            resource: storedProcedure as SqlStoredProcedureResource,
            options: {}
          }
        };
        const rpResponse = await createUpdateSqlStoredProcedure(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          storedProcedure.id,
          createSprocParams
        );
        return rpResponse && (rpResponse.properties?.resource as StoredProcedureDefinition & Resource);
      }

      throw new Error(`Failed to update stored procedure: ${storedProcedure.id} does not exist.`);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedure(storedProcedure.id)
      .replace(storedProcedure);
    return response?.resource;
  } catch (error) {
    const errorMessage = error.code === "NotFound" ? `${storedProcedure.id} does not exist.` : JSON.stringify(error);
    logConsoleError(`Error while updating stored procedure ${storedProcedure.id}:\n ${errorMessage}`);
    logError(errorMessage, "UpdateStoredProcedure", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
