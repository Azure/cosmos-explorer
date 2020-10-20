import * as DataModels from "../../Contracts/DataModels";
import { client } from "../CosmosClient";
import { logConsoleProgress, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";
import { getMongoDBCollection } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { MongoDBCollectionResource } from "../../Utils/arm/generatedClients/2020-04-01/types";
import * as Constants from "../../Common/Constants";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .read({ populateQuotaInfo: true });
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    logConsoleError(`Error while querying container ${collectionId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return collection;
}

export async function getMongoCollectionIndexTransformationProgress(
  databaseId: string,
  collectionId: string
): Promise<number> {
  let indexTransformationPercentage: number;
  const clearMessage = logConsoleProgress(`Reading container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .read({ populateQuotaInfo: true });

    indexTransformationPercentage = parseInt(
      response.headers[Constants.HttpHeaders.collectionIndexTransformationProgress] as string
    );
  } catch (error) {
    logConsoleError(`Error while reading container ${collectionId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return indexTransformationPercentage;
}

export async function readMongoDBCollectionThroughRP(
  databaseId: string,
  collectionId: string
): Promise<MongoDBCollectionResource> {
  let collection: MongoDBCollectionResource;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  const clearMessage = logConsoleProgress(`Reading container ${collectionId}`);
  try {
    const response = await getMongoDBCollection(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    collection = response.properties.resource as MongoDBCollectionResource;
  } catch (error) {
    logConsoleError(`Error while querying container ${collectionId}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadMongoDBCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return collection;
}
