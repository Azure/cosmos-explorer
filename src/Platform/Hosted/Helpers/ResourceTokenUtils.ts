export interface ParsedResourceTokenConnectionString {
  accountEndpoint: string;
  collectionId: string;
  databaseId: string;
  partitionKey?: string;
  resourceToken: string;
}

export function parseResourceTokenConnectionString(connectionString: string): ParsedResourceTokenConnectionString {
  let accountEndpoint: string;
  let collectionId: string;
  let databaseId: string;
  let partitionKey: string;
  let resourceToken: string;
  const connectionStringParts = connectionString.split(";");
  connectionStringParts.forEach((part: string) => {
    if (part.startsWith("type=resource")) {
      resourceToken = part + ";";
    } else if (part.startsWith("AccountEndpoint=")) {
      accountEndpoint = part.substring(16);
    } else if (part.startsWith("DatabaseId=")) {
      databaseId = part.substring(11);
    } else if (part.startsWith("CollectionId=")) {
      collectionId = part.substring(13);
    } else if (part.startsWith("PartitionKey=")) {
      partitionKey = part.substring(13);
    } else if (part !== "") {
      resourceToken += part + ";";
    }
  });

  return {
    accountEndpoint,
    collectionId,
    databaseId,
    partitionKey,
    resourceToken,
  };
}

export function isResourceTokenConnectionString(connectionString: string): boolean {
  return connectionString && connectionString.includes("type=resource");
}
