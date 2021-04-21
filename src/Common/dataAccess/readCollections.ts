import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
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
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience !== DefaultAccountExperienceType.Table
    ) {
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

  const { subscriptionId, resourceGroup, defaultExperience, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      rpResponse = await listSqlContainers(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case DefaultAccountExperienceType.MongoDB:
      rpResponse = await listMongoDBCollections(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case DefaultAccountExperienceType.Cassandra:
      rpResponse = await listCassandraTables(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case DefaultAccountExperienceType.Graph:
      rpResponse = await listGremlinGraphs(subscriptionId, resourceGroup, accountName, databaseId);
      break;
    case DefaultAccountExperienceType.Table:
      rpResponse = await listTables(subscriptionId, resourceGroup, accountName);
      break;
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }

  return rpResponse?.value?.map((collection) => collection.properties?.resource as DataModels.Collection);
}
