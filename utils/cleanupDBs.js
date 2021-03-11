const msRestNodeAuth = require("@azure/ms-rest-nodeauth");
const { CosmosDBManagementClient } = require("@azure/arm-cosmosdb");
const ms = require("ms");
const { time } = require("console");

const clientId = process.env["NOTEBOOKS_TEST_RUNNER_CLIENT_ID"];
const secret = process.env["NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET"];
const tenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const subscriptionId = "69e02f2d-f059-4409-9eac-97e8a276ae2c";
const resourceGroupName = "runners";

const sixtyMinutesAgo = new Date(Date.now() - 1000 * 60 * 60).getTime();

function friendlyTime(date) {
  try {
    return ms(date);
  } catch (error) {
    return "Unknown";
  }
}

// Deletes all SQL and Mongo databases created more than 20 minutes ago in the test runner accounts
async function main() {
  const credentials = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantId);
  const client = new CosmosDBManagementClient(credentials, subscriptionId);
  const accounts = await client.databaseAccounts.list(resourceGroupName);
  for (const account of accounts) {
    if (account.kind === "MongoDB") {
      const mongoDatabases = await client.mongoDBResources.listMongoDBDatabases(resourceGroupName, account.name);
      for (const database of mongoDatabases) {
        const timestamp = Number(database.name.split("-")[1]);
        if (timestamp && timestamp < sixtyMinutesAgo) {
          await client.mongoDBResources.deleteMongoDBDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    } else if (account.kind === "GlobalDocumentDB") {
      const sqlDatabases = await client.sqlResources.listSqlDatabases(resourceGroupName, account.name);
      for (const database of sqlDatabases) {
        const timestamp = Number(database.name.split("-")[1]);
        if (timestamp && timestamp < sixtyMinutesAgo) {
          await client.sqlResources.deleteSqlDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${friendlyTime(Date.now() - timestamp)}`);
        }
      }
    }
  }
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
