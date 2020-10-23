import { userContext } from "../../UserContext";
import { getMongoDBCollection } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { MongoDBCollectionResource } from "../../Utils/arm/generatedClients/2020-04-01/types";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import * as Constants from "../Constants";
import { client } from "../CosmosClient";

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
    collection = response.properties.resource;
  } catch (error) {
    logConsoleError(`Error while querying container ${collectionId}:\n ${error.message}`);
    logError(error.message, "ReadMongoDBCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return collection;
}

export async function getMongoDBCollectionIndexTransformationProgress(
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
    logConsoleError(`Error while reading container ${collectionId}:\n ${error.message}`);
    logError(error.message, "ReadCollection", error.code);
    sendNotificationForError(error);
    throw error;
  }
  clearMessage();
  return indexTransformationPercentage;
}
