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

export const getDatabaseName = (): string => {
  const { apiType } = userContext;
  switch (apiType) {
    case "SQL":
    case "Mongo":
    case "Gremlin":
    case "Tables":
      return "Database";
    case "Cassandra":
      return "Keyspace";
    default:
      throw new Error(`Unknown API type: ${apiType}`);
  }
};

export const getUploadName = (): string => {
  switch (userContext.apiType) {
    case "Cassandra":
    case "Tables":
      return "Tables";
    case "Gremlin":
      return "Graph";
    default:
      return "Items";
  }
};
