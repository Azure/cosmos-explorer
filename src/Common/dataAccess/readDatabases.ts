import * as DataModels from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { client } from "../CosmosClient";
import { listSqlDatabases } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function readDatabases(): Promise<DataModels.Database[]> {
  let databases: DataModels.Database[];
  const clearMessage = logConsoleProgress(`Querying databases`);
  try {
    if (window.authType === AuthType.AAD) {
      const rpResponse = await listSqlDatabases(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name
      );
      databases =
        rpResponse &&
        rpResponse.value &&
        rpResponse.value.map(database => {
          return database.properties && database.properties.resource as DataModels.Database;
        });
    } else {
      const sdkResponse = await client()
        .databases.readAll()
        .fetchAll();
      databases = sdkResponse.resources as DataModels.Database[];
    }
  } catch (error) {
    logConsoleError(`Error while querying databases:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadDatabases", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return databases;
}
