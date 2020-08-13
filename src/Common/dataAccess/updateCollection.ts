import { AuthType } from "../../AuthType";
import { Collection } from "../../Contracts/DataModels";
import { ContainerDefinition } from "@azure/cosmos";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { client } from "../CosmosClient";
import { createUpdateSqlContainer, getSqlContainer } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { ExtendedResourceProperties, SqlContainerResource } from "../../Utils/arm/generatedClients/2020-04-01/types";
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
    if (window.authType === AuthType.AAD) {
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
    // case DefaultAccountExperienceType.MongoDB:
    //   rpResponse = await listMongoDBCollections(subscriptionId, resourceGroup, accountName, databaseId);
    //   break;
    // case DefaultAccountExperienceType.Cassandra:
    //   rpResponse = await listCassandraTables(subscriptionId, resourceGroup, accountName, databaseId);
    //   break;
    // case DefaultAccountExperienceType.Graph:
    //   rpResponse = await listGremlinGraphs(subscriptionId, resourceGroup, accountName, databaseId);
    //   break;
    // case DefaultAccountExperienceType.Table:
    //   rpResponse = await listTables(subscriptionId, resourceGroup, accountName);
    //   break;
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
      getResponse
    );
    return updateResponse && (updateResponse.properties.resource as Collection);
  }

  throw new Error(`Collection to update does not exist. Database id: ${databaseId} Collection id: ${collectionId}`);
}
