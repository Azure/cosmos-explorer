import { ConflictDefinition, FeedOptions, QueryIterator, Resource } from "@azure/cosmos";
import { ClientOperationType, client } from "../CosmosClient";

export const queryConflicts = (
  databaseId: string,
  containerId: string,
  query: string,
  options: FeedOptions,
): QueryIterator<ConflictDefinition & Resource> => {
  return client(ClientOperationType.READ).database(databaseId).container(containerId).conflicts.query(query, options);
};
