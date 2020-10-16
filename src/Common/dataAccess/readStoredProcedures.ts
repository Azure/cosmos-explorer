import { AuthType } from "../../AuthType";
import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { listSqlStoredProcedures } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function readStoredProcedures(
  databaseId: string,
  collectionId: string
): Promise<(StoredProcedureDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying stored procedures for container ${collectionId}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      const rpResponse = await listSqlStoredProcedures(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      return rpResponse?.value?.map(sproc => sproc.properties?.resource as StoredProcedureDefinition & Resource);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedures.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    logConsoleError(`Failed to query stored procedures for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadStoredProcedures", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
