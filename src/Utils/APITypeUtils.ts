import { userContext } from "../UserContext";

export const getCollectionName = (isPlural?: boolean): string => {
  let collectionName: string;
  let unknownApiType: never;
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
      unknownApiType = userContext.apiType;
      throw new Error(`Unknown API type: ${unknownApiType}`);
  }

  if (isPlural) {
    collectionName += "s";
  }

  return collectionName;
};
