import { userContext } from "../UserContext";

interface CollectionNameOptions {
  isLowerCase?: boolean;
  isPlural?: boolean;
}

export const getCollectionName = (options?: CollectionNameOptions): string => {
  let collectionName: string;
  switch (userContext.apiType) {
    case "SQL":
      collectionName = "Container";
      break;
    case "Mongo":
      collectionName = "Collection";
      break;
    case "Cassandra":
    case "Tables":
      collectionName = "Table";
      break;
    case "Gremlin":
      collectionName = "Graph";
      break;
    default:
      throw new Error(`Unknown API type: ${userContext.apiType}`);
  }

  if (options?.isLowerCase) {
    collectionName = collectionName.toLocaleLowerCase();
  }

  if (options?.isPlural) {
    collectionName += "s";
  }

  return collectionName;
};
