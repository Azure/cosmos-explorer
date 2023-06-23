import { CosmosClient } from "@azure/cosmos";
import { sampleDataClient } from "Common/SampleDataClient";
import { userContext } from "UserContext";
import * as DataModels from "../../Contracts/DataModels";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  const cosmosClient = client();
  return await readCollectionInternal(cosmosClient, databaseId, collectionId);
}

export async function readSampleCollection(): Promise<DataModels.Collection> {
  const cosmosClient = sampleDataClient();

  const sampleDataConnectionInfo = userContext.sampleDataConnectionInfo;
  const databaseId = sampleDataConnectionInfo?.databaseId;
  const collectionId = sampleDataConnectionInfo?.collectionId;

  if (!databaseId || !collectionId) {
    return undefined;
  }

  return await readCollectionInternal(cosmosClient, databaseId, collectionId);
}

export async function readCollectionInternal(cosmosClient: CosmosClient, databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
  try {
    const response = await cosmosClient.database(databaseId).container(collectionId).read();
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    handleError(error, "ReadCollection", `Error while querying container ${collectionId}`);
    throw error;
  }
  clearMessage();
  return collection;
}
