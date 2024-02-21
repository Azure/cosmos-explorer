import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import * as Constants from "../Constants";
import { ClientOperationType, client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function getIndexTransformationProgress(databaseId: string, collectionId: string): Promise<number> {
  if (userContext.authType !== AuthType.AAD) {
    return undefined;
  }
  let indexTransformationPercentage: number;
  const clearMessage = logConsoleProgress(`Reading container ${collectionId}`);
  try {
    const response = await client(ClientOperationType.READ)
      .database(databaseId)
      .container(collectionId)
      .read({ populateQuotaInfo: true });

    indexTransformationPercentage = parseInt(
      response.headers[Constants.HttpHeaders.collectionIndexTransformationProgress] as string,
    );
  } catch (error) {
    handleError(error, "ReadMongoDBCollection", `Error while reading container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return indexTransformationPercentage;
}
