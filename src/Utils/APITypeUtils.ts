import { userContext } from "../UserContext";

export const getCollectionName = (isPlural?: boolean): string => {
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
    default: {
      const assertUnreachable = (apiType: never): never => {
        throw new Error(`Unknown API type: ${apiType}`);
      };
      return assertUnreachable(userContext.apiType);
    }
  }

  if (isPlural) {
    collectionName += "s";
  }

  return collectionName;
};
