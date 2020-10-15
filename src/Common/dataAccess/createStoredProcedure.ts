import { AuthType } from "../../AuthType";
import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import {
  SqlStoredProcedureCreateUpdateParameters,
  SqlStoredProcedureResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import { createUpdateSqlStoredProcedure } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function createStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition
): Promise<StoredProcedureDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating stored procedure ${storedProcedure.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
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

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedures.create(storedProcedure);
    return response?.resource;
  } catch (error) {
    logConsoleError(`Error while creating stored procedure ${storedProcedure.id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "CreateStoredProcedure", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
