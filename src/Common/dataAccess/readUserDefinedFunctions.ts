import { AuthType } from "../../AuthType";
import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { listSqlUserDefinedFunctions } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function readUserDefinedFunctions(
  databaseId: string,
  collectionId: string
): Promise<(UserDefinedFunctionDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying user defined functions for container ${collectionId}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      const rpResponse = await listSqlUserDefinedFunctions(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      return rpResponse?.value?.map(udf => udf.properties?.resource as UserDefinedFunctionDefinition & Resource);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunctions.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    logConsoleError(`Failed to query user defined functions for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadUserDefinedFunctions", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
