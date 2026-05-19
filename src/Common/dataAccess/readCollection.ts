import { CosmosClient } from "@azure/cosmos";
import * as DataModels from "../../Contracts/DataModels";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
  const cosmosClient = client();
  return await readCollectionInternal(cosmosClient, databaseId, collectionId);
}

export async function readCollectionInternal(
  cosmosClient: CosmosClient,
  databaseId: string,
  collectionId: string,
): Promise<DataModels.Collection> {
  let collection: DataModels.Collection;
  try {
    const response = await cosmosClient.database(databaseId).container(collectionId).read();
    collection = response.resource as DataModels.Collection;
  } catch (error) {
    handleError(error, "ReadCollection", `Error while querying container ${collectionId}`);
    throw error;
  }
  return collection;
}
