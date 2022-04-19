import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { getMongoDBCollection } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { MongoDBCollectionResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { handleError } from "../ErrorHandlingUtils";

export async function readMongoDBCollectionThroughRP(
  databaseId: string,
  collectionId: string
): Promise<MongoDBCollectionResource | undefined> {
  if (userContext.authType !== AuthType.AAD) {
    return undefined;
  }
  let collection: MongoDBCollectionResource | undefined;

  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount !== undefined ? databaseAccount.name : "";

  const clearMessage = logConsoleProgress(`Reading container ${collectionId}`);
  try {
    const response = await getMongoDBCollection(
      subscriptionId !== undefined ? subscriptionId : "",
      resourceGroup !== undefined ? resourceGroup : "",
      accountName,
      databaseId,
      collectionId
    );
    if (response.properties !== undefined) {
      collection = response.properties.resource;
    }
  } catch (error) {
    handleError(error, "ReadMongoDBCollection", `Error while reading container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return collection;
}
