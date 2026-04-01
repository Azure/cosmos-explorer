import { ContainerResponse } from "@azure/cosmos";
import { Queries } from "Common/Constants";
import * as Logger from "Common/Logger";
import { CosmosDbArtifactType } from "Contracts/FabricMessagesContract";
import { isFabric, isFabricMirroredKey } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import { FabricArtifactInfo, userContext } from "../../UserContext";
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
  const startKey = traceStart(Action.ReadCollections, {
    dataExplorerArea: "ResourceTree",
    databaseId,
    apiType: userContext.apiType,
  });

  if (isFabricMirroredKey() && userContext.fabricContext?.databaseName === databaseId) {
    const collections: DataModels.Collection[] = [];
    const promises: Promise<ContainerResponse>[] = [];

    for (const collectionResourceId in (
      userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY]
    ).resourceTokenInfo.resourceTokens) {
      // Dictionary key looks like this: dbs/SampleDB/colls/Container
      const resourceIdObj = collectionResourceId.split("/");
      const tokenDatabaseId = resourceIdObj[1];
      const tokenCollectionId = resourceIdObj[3];

      if (tokenDatabaseId === databaseId) {
        promises.push(client().database(databaseId).container(tokenCollectionId).read());
      }
    }

    try {
      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        collections.push(response.resource as DataModels.Collection);
      });

      // Sort collections by id before returning
      collections.sort((a, b) => a.id.localeCompare(b.id));
      traceSuccess(Action.ReadCollections, { databaseId, collectionCount: collections.length }, startKey);
      return collections;
    } catch (error) {
      traceFailure(Action.ReadCollections, { databaseId, error: error?.message }, startKey);
      handleError(error, "ReadCollections", `Error while querying containers for database ${databaseId}`);
      throw error;
    } finally {
      clearMessage();
    }
  }

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables" &&
      !isFabric()
    ) {
      const result = await readCollectionsWithARM(databaseId);
      traceSuccess(Action.ReadCollections, { databaseId, collectionCount: result?.length, path: "ARM" }, startKey);
      return result;
    }

    Logger.logInfo(`readCollections: calling fetchAll for database ${databaseId}`, "readCollections");
    const fetchAllStart = Date.now();
    const sdkResponse = await client().database(databaseId).containers.readAll().fetchAll();
    Logger.logInfo(
      `readCollections: fetchAll completed for database ${databaseId}, count=${sdkResponse.resources
        ?.length}, durationMs=${Date.now() - fetchAllStart}`,
      "readCollections",
    );
    traceSuccess(
      Action.ReadCollections,
      { databaseId, collectionCount: sdkResponse.resources?.length, path: "SDK" },
      startKey,
    );
    return sdkResponse.resources as DataModels.Collection[];
  } catch (error) {
    traceFailure(Action.ReadCollections, { databaseId, error: error?.message }, startKey);
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
  const startKey = traceStart(Action.ReadCollections, {
    dataExplorerArea: "ResourceTree",
    databaseId,
    paginated: true,
  });
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
    traceSuccess(
      Action.ReadCollections,
      { databaseId, collectionCount: collectionsWithPagination.collections?.length, paginated: true },
      startKey,
    );
    return collectionsWithPagination;
  } catch (error) {
    traceFailure(Action.ReadCollections, { databaseId, error: error?.message, paginated: true }, startKey);
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
