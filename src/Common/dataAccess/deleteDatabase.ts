import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { deleteSqlDatabase } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { deleteCassandraKeyspace } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { deleteMongoDBDatabase } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { deleteGremlinDatabase } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";
import { client } from "../CosmosClient";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function deleteDatabase(databaseId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting database ${databaseId}`);

  try {
    if (window.authType === AuthType.AAD) {
      await deleteDatabaseWithARM(databaseId);
    } else {
      await client()
        .database(databaseId)
        .delete();
    }
  } catch (error) {
    logConsoleError(`Error while deleting database ${databaseId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "DeleteDatabase", error.code);
    sendNotificationForError(error);
    throw error;
  }
  logConsoleInfo(`Successfully deleted database ${databaseId}`);
  clearMessage();
  await refreshCachedResources();
}

function deleteDatabaseWithARM(databaseId: string): Promise<void> {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return deleteSqlDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.MongoDB:
      return deleteMongoDBDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.Cassandra:
      return deleteCassandraKeyspace(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.Graph:
      return deleteGremlinDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }
}
