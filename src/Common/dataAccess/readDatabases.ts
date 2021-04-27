import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import { listCassandraKeyspaces } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { listGremlinDatabases } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { listMongoDBDatabases } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { listSqlDatabases } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readDatabases(): Promise<DataModels.Database[]> {
  let databases: DataModels.Database[];
  const clearMessage = logConsoleProgress(`Querying databases`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.apiType !== DefaultAccountExperienceType.Table
    ) {
      databases = await readDatabasesWithARM();
    } else {
      const sdkResponse = await client().databases.readAll().fetchAll();
      databases = sdkResponse.resources as DataModels.Database[];
    }
  } catch (error) {
    handleError(error, "ReadDatabases", `Error while querying databases`);
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
  const defaultExperience = userContext.apiType;

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

  return rpResponse?.value?.map((database) => database.properties?.resource as DataModels.Database);
}
