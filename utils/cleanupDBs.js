const { CosmosClient } = require("@azure/cosmos");

// TODO: Add support for other API connection strings
const mongoRegex = RegExp("mongodb://.*:(.*)@(.*).mongo.cosmos.azure.com");

const connectionString = process.env.PORTAL_RUNNER_CONNECTION_STRING;

async function cleanup() {
  if (!connectionString) {
    throw new Error("Connection string not provided");
  }

  let client;
  switch (true) {
    case connectionString.includes("mongodb://"): {
      const [, key, accountName] = connectionString.match(mongoRegex);
      client = new CosmosClient({
        key,
        endpoint: `https://${accountName}.documents.azure.com:443/`,
      });
      break;
    }
    // TODO: Add support for other API connection strings
    default:
      client = new CosmosClient(connectionString);
      break;
  }

  const response = await client.databases.readAll().fetchAll();
  return Promise.all(
    response.resources.map(async (db) => {
      const dbTimestamp = new Date(db._ts * 1000);
      const twentyMinutesAgo = new Date(Date.now() - 1000 * 60 * 20);
      if (dbTimestamp < twentyMinutesAgo) {
        await client.database(db.id).delete();
        console.log(`DELETED: ${db.id} | Timestamp: ${dbTimestamp}`);
      } else {
        console.log(`SKIPPED: ${db.id} | Timestamp: ${dbTimestamp}`);
      }
    })
  );
}

cleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
