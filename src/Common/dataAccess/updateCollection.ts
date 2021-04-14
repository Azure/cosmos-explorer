import { ContainerDefinition } from "@azure/cosmos";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { AuthType } from "../../AuthType";
import { Collection } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import {
  createUpdateCassandraTable,
  getCassandraTable,
} from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import {
  createUpdateGremlinGraph,
  getGremlinGraph,
} from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import {
  createUpdateMongoDBCollection,
  getMongoDBCollection,
} from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { createUpdateSqlContainer, getSqlContainer } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { createUpdateTable, getTable } from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import {
  ExtendedResourceProperties,
  MongoDBCollectionCreateUpdateParameters,
  SqlContainerCreateUpdateParameters,
  SqlContainerResource,
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function updateCollection(
  databaseId: string,
  collectionId: string,
  newCollection: Partial<Collection>,
  options: RequestOptions = {}
): Promise<Collection> {
  let collection: Collection;
  const clearMessage = logConsoleProgress(`Updating container ${collectionId}`);

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
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

    logConsoleInfo(`Successfully updated container ${collectionId}`);
    return collection;
  } catch (error) {
    handleError(error, "UpdateCollection", `Failed to update container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

async function updateCollectionWithARM(
  databaseId: string,
  collectionId: string,
  newCollection: Partial<Collection>
): Promise<Collection> {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return updateSqlContainer(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.Cassandra:
      return updateCassandraTable(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.Graph:
      return updateGremlinGraph(databaseId, collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.Table:
      return updateTable(collectionId, subscriptionId, resourceGroup, accountName, newCollection);
    case DefaultAccountExperienceType.MongoDB:
      return updateMongoDBCollection(
        databaseId,
        collectionId,
        subscriptionId,
        resourceGroup,
        accountName,
        newCollection
      );
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
  newCollection: Partial<Collection>
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

export async function updateMongoDBCollection(
  databaseId: string,
  collectionId: string,
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
  newCollection: Partial<Collection>
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
      getResponse as MongoDBCollectionCreateUpdateParameters
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
  newCollection: Partial<Collection>
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
  newCollection: Partial<Collection>
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
  newCollection: Partial<Collection>
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
