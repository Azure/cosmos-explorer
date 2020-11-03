import { userContext } from "../../UserContext";
import { getMongoDBCollection } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { MongoDBCollectionResource } from "../../Utils/arm/generatedClients/2020-04-01/types";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import * as Constants from "../Constants";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { AuthType } from "../../AuthType";

export async function readMongoDBCollectionThroughRP(
  databaseId: string,
  collectionId: string
): Promise<MongoDBCollectionResource> {
  if (window.authType !== AuthType.AAD) {
    return undefined;
  }
  let collection: MongoDBCollectionResource;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  const clearMessage = logConsoleProgress(`Reading container ${collectionId}`);
  try {
    const response = await getMongoDBCollection(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    collection = response.properties.resource;
  } catch (error) {
    handleError(error, "ReadMongoDBCollection", `Error while reading container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return collection;
}

export async function getMongoDBCollectionIndexTransformationProgress(
  databaseId: string,
  collectionId: string
): Promise<number> {
  if (window.authType !== AuthType.AAD) {
    return undefined;
  }
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
    handleError(error, "ReadMongoDBCollection", `Error while reading container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return indexTransformationPercentage;
}
