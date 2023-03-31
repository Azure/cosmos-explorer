import { Queries } from "Common/Constants";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { listCassandraTables } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { listGremlinGraphs } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { listMongoDBCollections } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { listSqlContainers } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { listTables } from "../../Utils/arm/generatedClients/cosmos/tableResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollections(databaseId: string): Promise<DataModels.Collection[]> {
  const clearMessage = logConsoleProgress(`Querying containers for database ${databaseId}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables"
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

export async function readCollectionsWithPagination(
  databaseId: string,
  continuationToken?: string
): Promise<DataModels.CollectionsWithPagination> {
  const clearMessage = logConsoleProgress(`Querying containers for database ${databaseId}`);
  try {
    const sdkResponse = await client()
      .database(databaseId)
      .containers.query(
        { query: "SELECT * FROM c" },
        {
          continuationToken,
          maxItemCount: Queries.containersPerPage,
        }
      )
      .fetchNext();
    const collectionsWithPagination: DataModels.CollectionsWithPagination = {
      collections: sdkResponse.resources as DataModels.Collection[],
      continuationToken: sdkResponse.continuationToken,
    };
    return collectionsWithPagination;
  } catch (error) {
    handleError(error, "ReadCollections", `Error while querying containers for database ${databaseId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

async function readCollectionsWithARM(databaseId: string): Promise<DataModels.Collection[]> {
  let rpResponse;

  const { subscriptionId, resourceGroup, apiType, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  switch (apiType) {
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
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }

  return rpResponse?.value?.map((collection) => collection.properties?.resource as DataModels.Collection);
}
