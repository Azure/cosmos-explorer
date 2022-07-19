import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { listCassandraKeyspaces } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { listGremlinDatabases } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { listMongoDBDatabases } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { listSqlDatabases } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readDatabases(): Promise<DataModels.Database[]> {
  let databases: DataModels.Database[];
  const clearMessage = logConsoleProgress(`Querying databases`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables"
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
  const { subscriptionId, resourceGroup, apiType, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  switch (apiType) {
    case "SQL":
      rpResponse = await listSqlDatabases(subscriptionId, resourceGroup, accountName);
      break;
    case "Mongo":
      rpResponse = await listMongoDBDatabases(subscriptionId, resourceGroup, accountName);
      break;
    case "Cassandra":
      rpResponse = await listCassandraKeyspaces(subscriptionId, resourceGroup, accountName);
      break;
    case "Gremlin":
      rpResponse = await listGremlinDatabases(subscriptionId, resourceGroup, accountName);
      break;
    default:
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }

  return rpResponse?.value?.map((database) => database.properties?.resource as DataModels.Database);
}
