
import * as DataModels from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { CosmosClient } from "../CosmosClient";
import { listSqlContainers } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function readCollections(databaseId: string): Promise<DataModels.Collection[]> {
  let collections: DataModels.Collection[];
  const clearMessage = logConsoleProgress(`Querying containers for database ${databaseId}`);
  try {
    if (window.authType === AuthType.AAD) {
      const rpResponse = await listSqlContainers(
        CosmosClient.subscriptionId(),
        CosmosClient.resourceGroup(),
        CosmosClient.databaseAccount().name,
        databaseId
      );
      collections = rpResponse && rpResponse.value && rpResponse.value.map(collection => {
        return collection.properties && collection.properties.resource;
      });
    } else {
      const sdkResponse = await CosmosClient.client()
        .database(databaseId)
        .containers.readAll()
        .fetchAll();
      collections = sdkResponse.resources as DataModels.Collection[];
    }
  } catch (error) {
    logConsoleError(`Error while querying containers for database ${databaseId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadCollections", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return collections;
}
