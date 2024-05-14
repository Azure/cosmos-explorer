const { CosmosClient } = require("@azure/cosmos");

let endpoint = process.env.ENDPOINT;
let key = process.env.KEY;
let databaseId = process.env.DATABASE;
let containerId = process.env.CONTAINER;
let partitionKey = process.env.partitionKey;

// Super rudimentary, but dependency-free arg parsing
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--help":
      console.log("Usage: node generateResourceToken.js --endpoint <endpoint> --key <key> --database <database> --container <container> --partitionKey <partitionKey>");
      console.log("Options");
      console.log("  --endpoint: Cosmos DB endpoint (can also be set via ENDPOINT env var)");
      console.log("  --key: Cosmos DB key (can also be set via KEY env var)");
      console.log("  --database: Cosmos DB database ID (can also be set via DATABASE env var)");
      console.log("  --container: Cosmos DB container ID (can also be set via CONTAINER env var)");
      console.log("  --partitionKey: Cosmos DB container partition key (can also be set via partitionKey env var; Optional)");
      process.exit(0);
      break;
    case "--endpoint":
      i++;
      if (i >= args.length) {
        throw new Error("--endpoint requires an argument");
      }
      endpoint = args[i];
      break;
    case "--key":
      i++;
      if (i >= args.length) {
        throw new Error("--key requires an argument");
      }
      key = args[i];
      break;
    case "--database":
      i++;
      if (i >= args.length) {
        throw new Error("--database requires an argument");
      }
      databaseId = args[i];
      break;
    case "--container":
      i++;
      if (i >= args.length) {
        throw new Error("--container requires an argument");
      }
      containerId = args[i];
      break;
    case "--partitionKey":
      i++;
      if (i >= args.length) {
        throw new Error("--partitionKey requires an argument");
      }
      partitionKey = args[i];
      break;
    default:
      throw new Error(`Unknown argument: ${args[i]}`);
  }
}

if (!endpoint) {
  throw new Error("Endpoint is required, either via --endpoint or ENDPOINT env var");
}
if (!key) {
  throw new Error("Key is required, either via --key or KEY env var");
}
if (!databaseId) {
  throw new Error("Database is required, either via --database or DATABASE env var");
}
if (!containerId) {
  throw new Error("Container is required, either via --container or CONTAINER env var");
}

async function main() {
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
}).then(() => process.exit(0));
