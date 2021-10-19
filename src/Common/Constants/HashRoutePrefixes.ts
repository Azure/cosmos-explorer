export const databases = "/dbs/{db_id}";
export const collections = "/dbs/{db_id}/colls/{coll_id}";
export const sprocHash = "/sprocs/";
export const sprocs = collections + sprocHash + "{sproc_id}";
export const docs = collections + "/docs/{doc_id}/";
export const conflicts = collections + "/conflicts";

export const databasesWithId = (databaseId: string) => {
  return databases.replace("{db_id}", databaseId).replace("/", ""); // strip the first slash since hasher adds it
};

export const collectionsWithIds = (databaseId: string, collectionId: string) => {
  const transformedDatabasePrefix = collections.replace("{db_id}", databaseId);

  return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it
};

export const sprocWithIds = (databaseId: string, collectionId: string, sprocId: string, stripFirstSlash = true) => {
  const transformedDatabasePrefix = sprocs.replace("{db_id}", databaseId);

  const transformedSprocRoute = transformedDatabasePrefix
    .replace("{coll_id}", collectionId)
    .replace("{sproc_id}", sprocId);
  if (stripFirstSlash) {
    return transformedSprocRoute.replace("/", ""); // strip the first slash since hasher adds it
  }

  return transformedSprocRoute;
};

export const conflictsWithIds = (databaseId: string, collectionId: string) => {
  const transformedDatabasePrefix = conflicts.replace("{db_id}", databaseId);

  return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it;
};

export const docsWithIds = (databaseId: string, collectionId: string, docId: string): string => {
  const transformedDatabasePrefix = docs.replace("{db_id}", databaseId);
  return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("{doc_id}", docId).replace("/", ""); // strip the first slash since hasher adds it
};
