import { CosmosClient } from "@azure/cosmos";
import { sampleDataClient } from "Common/SampleDataClient";
import { userContext } from "UserContext";
import * as DataModels from "../../Contracts/DataModels";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  const cosmosClient = client();
  console.log("RUNNING HERE - readCollection");
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

  console.log("RUNNING HERE - readSampleCollection");
  return await readCollectionInternal(cosmosClient, databaseId, collectionId);
}

export async function readCollectionInternal(
  cosmosClient: CosmosClient,
  databaseId: string,
  collectionId: string,
): Promise<DataModels.Collection> {
  console.log("RUNNING HERE - Read Collection Internal");
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
  try {
    const response = await cosmosClient.database(databaseId).container(collectionId).read();
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    handleError(error, "ReadCollection", `Error while querying container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
  return collection;
}
