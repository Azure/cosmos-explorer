const { CosmosClient } = require("@azure/cosmos");

async function main() {
  const endpoint = process.env.ENDPOINT;
  if (!endpoint) {
    throw new Error("Expected env var ENDPOINT");
  }
  const key = process.env.KEY;
  if (!key) {
    throw new Error("Expected env var KEY");
  }
  const databaseId = process.env.DATABASE;
  if (!databaseId) {
    throw new Error("Expected env var DATABASE");
  }
  const containerId = process.env.CONTAINER;
  if (!containerId) {
    throw new Error("Expected env var CONTAINER");
  }
  const partitionKey = process.env.partitionKey;

  const client = new CosmosClient({
    endpoint,
    key
  });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  const { user } = await database.users.upsert({ id: "testUser" });

  const { resource: containerPermission } = await user.permissions.upsert({
    id: "partitionLevelPermission",
    permissionMode: "All",
    resource: container.url
  });

  console.log("---- Container Level ----");
  console.log("Token:", containerPermission._token);
  console.log(
    "Connection String:",
    `AccountEndpoint=${endpoint};DatabaseId=${databaseId};CollectionId=${containerId};${containerPermission._token}`
  );

  //   const { resource: containerPermission } = await user.permissions.upsert({
  //     id: "partitionLevelPermission",
  //     permissionMode: PermissionMode.All,
  //     resourcePartitionKey: ["p1"],
  //     resource: container.url
  //   });
}

main().catch(error => {
  console.log("Error!");
  throw error;
});
