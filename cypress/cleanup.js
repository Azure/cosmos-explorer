// Cleans up old databases from previous test runs
const { CosmosClient } = require("@azure/cosmos");

// TODO: Add support for other APIs
const mongoRegex = RegExp("mongodb://.*:(.*)@(.*).mongo.cosmos.azure.com");
const sqlRegex = RegExp("AccountEndpoint=https://(.*).documents.azure.com");

async function cleanup() {
  const connectionString = process.env.CYPRESS_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Connection string not provided");
  }

  let client;
  switch (connectionString) {
    case sqlRegex.test(sqlRegex):
      break;

    default:
      throw new Error("Unable to extract account name and key from connection string");
      break;
  }

  const client = new CosmosClient(connectionString);

  const response = await client.databases.readAll().fetchAll();
  return Promise.all(
    response.resources.map(async db => {
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
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
