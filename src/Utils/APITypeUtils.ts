import { userContext } from "../UserContext";

export const getCollectionName = (isLowerCase?: boolean, isPlural?: boolean): string => {
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

  if (isLowerCase) {
    collectionName = collectionName.toLocaleLowerCase();
  }

  if (isPlural) {
    collectionName += "s";
  }

  return collectionName;
};
