import { AuthType } from "../../AuthType";
import { Collection } from "../../Contracts/DataModels";
import { ContainerDefinition } from "@azure/cosmos";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import {
  ExtendedResourceProperties,
  SqlContainerCreateUpdateParameters,
  SqlContainerResource
} from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/types";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { client } from "../CosmosClient";
import {
  createUpdateSqlContainer,
  getSqlContainer
} from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/sqlResources";
import {
  createUpdateCassandraTable,
  getCassandraTable
} from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/cassandraResources";
import {
  createUpdateMongoDBCollection,
  getMongoDBCollection
} from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/mongoDBResources";
import {
  createUpdateGremlinGraph,
  getGremlinGraph
} from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/gremlinResources";
import { createUpdateTable, getTable } from "../../Utils/arm/generatedClients/2020-04-01-cosmos-db/tableResources";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function updateCollection(
  databaseId: string,
  collectionId: string,
  newCollection: Collection,
  options: RequestOptions = {}
): Promise<Collection> {
  let collection: Collection;
  const clearMessage = logConsoleProgress(`Updating container ${collectionId}`);

  try {
    if (
      window.authType === AuthType.AAD &&
      userContext.defaultExperience !== DefaultAccountExperienceType.MongoDB &&
      userContext.defaultExperience !== DefaultAccountExperienceType.Table
    ) {
      collection = await updateCollectionWithARM(databaseId, collectionId, newCollection);
    } else {
      const sdkResponse = await client()
        .database(databaseId)
        .container(collectionId)
        .replace(newCollection as ContainerDefinition, options);
      collection = sdkResponse.resource as Collection;
    }
  } catch (error) {
    logConsoleError(`Failed to update container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "UpdateCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  logConsoleInfo(`Successfully updated container ${collectionId}`);
  clearMessage();
  await refreshCachedResources();
  return collection;
}

async function updateCollectionWithARM(
  databaseId: string,
  collectionId: string,
  newCollection: Collection
): Promise<Collection> {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return updateSqlContainer(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.MongoDB:
      return updateMongoDBCollection(
        databaseId,
        collectionId,
        subscriptionId,
        resourceGroup,
        accountName,
        newCollection
      );
    case DefaultAccountExperienceType.Cassandra:
      return updateCassandraTable(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.Graph:
      return updateGremlinGraph(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.Table:
      return updateTable(collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }
}

async function updateSqlContainer(
  databaseId: string,
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Collection
): Promise<Collection> {
  const getResponse = await getSqlContainer(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
  if (getResponse && getResponse.properties && getResponse.properties.resource) {
    getResponse.properties.resource = newCollection as SqlContainerResource & ExtendedResourceProperties;
    const updateResponse = await createUpdateSqlContainer(
      subscriptionId,
      resourceGroup,
      accountName,
      databaseId,
      collectionId,
      getResponse as SqlContainerCreateUpdateParameters
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(`Sql container to update does not exist. Database id: ${databaseId} Collection id: ${collectionId}`);
}

async function updateMongoDBCollection(
  databaseId: string,
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Collection
): Promise<Collection> {
  const getResponse = await getMongoDBCollection(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
  if (getResponse && getResponse.properties && getResponse.properties.resource) {
    getResponse.properties.resource = newCollection as SqlContainerResource & ExtendedResourceProperties;
    const updateResponse = await createUpdateMongoDBCollection(
      subscriptionId,
      resourceGroup,
      accountName,
      databaseId,
      collectionId,
      getResponse as SqlContainerCreateUpdateParameters
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(
    `MongoDB collection to update does not exist. Database id: ${databaseId} Collection id: ${collectionId}`
  );
}

async function updateCassandraTable(
  databaseId: string,
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Collection
): Promise<Collection> {
  const getResponse = await getCassandraTable(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
  if (getResponse && getResponse.properties && getResponse.properties.resource) {
    getResponse.properties.resource = newCollection as SqlContainerResource & ExtendedResourceProperties;
    const updateResponse = await createUpdateCassandraTable(
      subscriptionId,
      resourceGroup,
      accountName,
      databaseId,
      collectionId,
      getResponse as SqlContainerCreateUpdateParameters
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(
    `Cassandra table to update does not exist. Database id: ${databaseId} Collection id: ${collectionId}`
  );
}

async function updateGremlinGraph(
  databaseId: string,
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Collection
): Promise<Collection> {
  const getResponse = await getGremlinGraph(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
  if (getResponse && getResponse.properties && getResponse.properties.resource) {
    getResponse.properties.resource = newCollection as SqlContainerResource & ExtendedResourceProperties;
    const updateResponse = await createUpdateGremlinGraph(
      subscriptionId,
      resourceGroup,
      accountName,
      databaseId,
      collectionId,
      getResponse as SqlContainerCreateUpdateParameters
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(`Gremlin graph to update does not exist. Database id: ${databaseId} Collection id: ${collectionId}`);
}

async function updateTable(
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Collection
): Promise<Collection> {
  const getResponse = await getTable(subscriptionId, resourceGroup, accountName, collectionId);
  if (getResponse && getResponse.properties && getResponse.properties.resource) {
    getResponse.properties.resource = newCollection as SqlContainerResource & ExtendedResourceProperties;
    const updateResponse = await createUpdateTable(
      subscriptionId,
      resourceGroup,
      accountName,
      collectionId,
      getResponse as SqlContainerCreateUpdateParameters
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(`Table to update does not exist. Table id: ${collectionId}`);
}
