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
    case "Postgres":
      return "";
    default:
      throw new Error(`Unknown API type: ${userContext.apiType}`);
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

export const getApiShortDisplayName = (): string => {
  switch (userContext.apiType) {
    case "Cassandra":
      return "Apache Cassandra API";
    case "Gremlin":
      return "Apache Gremlin API";
    case "Mongo":
      return "MongoDB API";
    case "Postgres":
      return "PostgreSQL API";
    case "SQL":
      return "NoSQL API";
    case "Tables":
      return "Table API";
    case "VCoreMongo":
      return "MongoDB (vCore) API";
  }
};

export const getItemName = (): string => {
  switch (userContext.apiType) {
    case "Tables":
      return "Entities";
    case "Cassandra":
      return "Rows";
    case "Gremlin":
      return "Graph";
    case "Mongo":
      return "Documents";
    default:
      return "Items";
  }
};

export const isDataplaneRbacSupported = (apiType: string): boolean => {
  return apiType === "SQL" || apiType === "Tables" || apiType === "Gremlin";
};
