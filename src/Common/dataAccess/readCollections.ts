import { ContainerResponse } from "@azure/cosmos";
import { Queries } from "Common/Constants";
import { Platform, configContext } from "ConfigContext";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { listCassandraTables } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { listGremlinGraphs } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { listMongoDBCollections } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { listSqlContainers } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { listTables } from "../../Utils/arm/generatedClients/cosmos/tableResources";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollections(databaseId: string): Promise<DataModels.Collection[]> {
  const clearMessage = logConsoleProgress(`Querying containers for database ${databaseId}`);

  if (
    configContext.platform === Platform.Fabric &&
    userContext.fabricDatabaseConnectionInfo &&
    userContext.fabricDatabaseConnectionInfo.databaseId === databaseId
  ) {
    const collections: DataModels.Collection[] = [];
    const promises: Promise<ContainerResponse>[] = [];

    for (const collectionResourceId in userContext.fabricDatabaseConnectionInfo.resourceTokens) {
      // Dictionary key looks like this: dbs/SampleDB/colls/Container
      const resourceIdObj = collectionResourceId.split("/");
      const tokenDatabaseId = resourceIdObj[1];
      const tokenCollectionId = resourceIdObj[3];

      if (tokenDatabaseId === databaseId) {
        promises.push(client().database(databaseId).container(tokenCollectionId).read());
      }
    }

    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      collections.push(response.resource as DataModels.Collection);
    });

    // Sort collections by id before returning
    collections.sort((a, b) => a.id.localeCompare(b.id));
    return collections;
  }

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
  continuationToken?: string,
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
        },
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
