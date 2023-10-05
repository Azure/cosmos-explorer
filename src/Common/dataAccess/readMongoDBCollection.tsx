import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { getMongoDBCollection } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { MongoDBCollectionResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { handleError } from "../ErrorHandlingUtils";

export async function readMongoDBCollectionThroughRP(
  databaseId: string,
  collectionId: string,
): Promise<MongoDBCollectionResource> {
  if (userContext.authType !== AuthType.AAD) {
    return undefined;
  }
  let collection: MongoDBCollectionResource;

  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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
