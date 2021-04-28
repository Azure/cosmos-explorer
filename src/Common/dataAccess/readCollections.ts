import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { listCassandraTables } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { listGremlinGraphs } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { listMongoDBCollections } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { listSqlContainers } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { listTables } from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollections(databaseId: string): Promise<DataModels.Collection[]> {
  const clearMessage = logConsoleProgress(`Querying containers for database ${databaseId}`);
  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations && userContext.apiType !== "Tables") {
      return await readCollectionsWithARM(databaseId);
    }

    const sdkResponse = await client().database(databaseId).containers.readAll().fetchAll();
    return sdkResponse.resources as DataModels.Collection[];
  } catch (error) {
    handleError(error, "ReadCollections", `Error while querying containers for database ${databaseId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

async function readCollectionsWithARM(databaseId: string): Promise<DataModels.Collection[]> {
  let rpResponse;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.apiType;

  switch (defaultExperience) {
    case "SQL":
      rpResponse = await listSqlContainers(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case "Mongo":
      rpResponse = await listMongoDBCollections(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case "Cassandra":
      rpResponse = await listCassandraTables(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case "Gremlin":
      rpResponse = await listGremlinGraphs(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case "Tables":
      rpResponse = await listTables(subscriptionId, resourceGroup, accountName);
      break;
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }

  return rpResponse?.value?.map((collection) => collection.properties?.resource as DataModels.Collection);
}
