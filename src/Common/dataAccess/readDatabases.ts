import * as DataModels from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { listSqlDatabases } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { listCassandraKeyspaces } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { listMongoDBDatabases } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { listGremlinDatabases } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { logConsoleProgress, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function readDatabases(): Promise<DataModels.Database[]> {
  if (userContext.defaultExperience === DefaultAccountExperienceType.Table) {
    return [{ id: "TablesDB" } as DataModels.Database];
  }

  let databases: DataModels.Database[];
  const clearMessage = logConsoleProgress(`Querying databases`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      databases = await readDatabasesWithARM();
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

async function readDatabasesWithARM(): Promise<DataModels.Database[]> {
  let rpResponse;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      rpResponse = await listSqlDatabases(subscriptionId, resourceGroup, accountName);
      break;
    case DefaultAccountExperienceType.MongoDB:
      rpResponse = await listMongoDBDatabases(subscriptionId, resourceGroup, accountName);
      break;
    case DefaultAccountExperienceType.Cassandra:
      rpResponse = await listCassandraKeyspaces(subscriptionId, resourceGroup, accountName);
      break;
    case DefaultAccountExperienceType.Graph:
      rpResponse = await listGremlinDatabases(subscriptionId, resourceGroup, accountName);
      break;
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }

  return rpResponse?.value?.map(database => database.properties?.resource as DataModels.Database);
}
