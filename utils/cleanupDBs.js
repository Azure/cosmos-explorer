const { AzureCliCredential } = require("@azure/identity");
const { CosmosDBManagementClient } = require("@azure/arm-cosmosdb");
const ms = require("ms");

// const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];
// const resourceGroupName = "de-e2e-tests";
const subscriptionId = "074d02eb-4d74-486a-b299-b262264d1536";
const resourceGroupName = "bchoudhury-e2e-testing";

const thirtyMinutesAgo = new Date(Date.now() - 1000 * 60 * 5).getTime();

function friendlyTime(date) {
  try {
    return ms(date);
  } catch (error) {
    return "Unknown";
  }
}

async function main() {
  const credentials = new AzureCliCredential();
  const client = new CosmosDBManagementClient(credentials, subscriptionId);
  const accounts = await client.databaseAccounts.listByResourceGroup(resourceGroupName);
  for (const account of accounts) {
    if (account.name.endsWith("-readonly")) {
      console.log(`SKIPPED: ${account.name}`);
      continue;
    }
    if (account.kind === "MongoDB") {
      const mongoDatabases = await client.mongoDBResources.listMongoDBDatabases(resourceGroupName, account.name);
      for (const database of mongoDatabases) {
        // Unfortunately Mongo does not provide a timestamp in ARM. There is no way to tell how old the DB is other thn encoding it in the ID :(
        const timestamp = Number(database.name.split("_").pop());
        if (timestamp && timestamp < thirtyMinutesAgo) {
          await client.mongoDBResources.deleteMongoDBDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    } else if (account.capabilities.find((c) => c.name === "EnableCassandra")) {
      const cassandraDatabases = await client.cassandraResources.listCassandraKeyspaces(
        resourceGroupName,
        account.name,
      );
      for (const database of cassandraDatabases) {
        const timestamp = Number(database.resource._ts) * 1000;
        if (timestamp && timestamp < thirtyMinutesAgo) {
          await client.cassandraResources.deleteCassandraKeyspace(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    } else if (account.capabilities.find((c) => c.name === "EnableTable")) {
      const tablesDatabase = await client.tableResources.listTables(resourceGroupName, account.name);
      for (const database of tablesDatabase) {
        const timestamp = Number(database.resource._ts) * 1000;
        if (timestamp && timestamp < thirtyMinutesAgo) {
          await client.tableResources.deleteTable(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    } else if (account.capabilities.find((c) => c.name === "EnableGremlin")) {
      const graphDatabases = await client.gremlinResources.listGremlinDatabases(resourceGroupName, account.name);
      for (const database of graphDatabases) {
        const timestamp = Number(database.resource._ts) * 1000;
        if (timestamp && timestamp < thirtyMinutesAgo) {
          await client.gremlinResources.deleteGremlinDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    } else if (account.kind === "GlobalDocumentDB") {
      const sqlDatabases = await client.sqlResources.listSqlDatabases(resourceGroupName, account.name);
      const sqlDatabasesToDelete = sqlDatabases.map(async (database) => {
        await deleteWithRetry(client, database, account.name);
      });
      await Promise.all(sqlDatabasesToDelete);
    }
  }
}

// Retry logic for handling throttling
async function deleteWithRetry(client, database, accountName) {
  const maxRetries = 5;
  let attempt = 0;
  let backoffTime = 1000; // Start with 1 second

  while (attempt < maxRetries) {
    try {
      const timestamp = Number(database.resource._ts) * 1000;
      if (timestamp && timestamp < thirtyMinutesAgo) {
        await client.sqlResources.deleteSqlDatabase(resourceGroupName, accountName, database.name);
        console.log(`DELETED: ${accountName} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
      } else {
        console.log(`SKIPPED: ${accountName} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
      }
      return;
    } catch (error) {
      if (error.statusCode === 429) {
        // Throttling error (HTTP 429), apply exponential backoff
        console.log(`Throttling detected, retrying ${database.name}... (Attempt ${attempt + 1})`);
        await delay(backoffTime);
        attempt++;
        backoffTime *= 2; // Exponential backoff
      } else {
        // For other errors, log and break
        console.error(`Error deleting ${database.name}:`, error);
        break;
      }
    }
  }
  console.log(`Failed to delete ${database.name} after ${maxRetries} attempts.`);
}

// Helper function to delay the retry attempts
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => {
    console.log("Completed");
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    console.log("Cleanup failed! Exiting with success. Cleanup should always fail safe.");
    process.exit(0);
  });