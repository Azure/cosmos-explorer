import { ConflictDefinition, FeedOptions, QueryIterator, Resource } from "@azure/cosmos";
import { client } from "../CosmosClient";

export const queryConflicts = (
  databaseId: string,
  containerId: string,
  query: string,
  options: FeedOptions,
): QueryIterator<ConflictDefinition & Resource> => {
  return client().database(databaseId).container(containerId).conflicts.query(query, options);
};
