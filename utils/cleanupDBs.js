const msRestNodeAuth = require("@azure/ms-rest-nodeauth");
const { CosmosDBManagementClient } = require("@azure/arm-cosmosdb");
const ms = require("ms");
const { time } = require("console");

const clientId = process.env["NOTEBOOKS_TEST_RUNNER_CLIENT_ID"];
const secret = process.env["NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET"];
const tenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const subscriptionId = "69e02f2d-f059-4409-9eac-97e8a276ae2c";
const resourceGroupName = "runners";

const thirtyMinutesAgo = new Date(Date.now() - 1000 * 60 * 30).getTime();

// Deletes all SQL and Mongo databases created more than 30 minutes ago in the test runner accounts
async function main() {
  const credentials = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantId);
  const client = new CosmosDBManagementClient(credentials, subscriptionId);
  const accounts = await client.databaseAccounts.list(resourceGroupName);
  for (const account of accounts) {
    if (account.kind === "MongoDB") {
      const mongoDatabases = await client.mongoDBResources.listMongoDBDatabases(resourceGroupName, account.name);
      for (const database of mongoDatabases) {
        const timestamp = database.name.split("-")[1];
        if (!timestamp || Number(timestamp) < thirtyMinutesAgo) {
          await client.mongoDBResources.deleteMongoDBDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${ms(Date.now() - Number(timestamp))}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${ms(Date.now() - Number(timestamp))}`);
        }
      }
    } else if (account.kind === "GlobalDocumentDB") {
      const sqlDatabases = await client.sqlResources.listSqlDatabases(resourceGroupName, account.name);
      for (const database of sqlDatabases) {
        const timestamp = database.name.split("-")[1];
        if (!timestamp || Number(timestamp) < thirtyMinutesAgo) {
          await client.sqlResources.deleteSqlDatabase(resourceGroupName, account.name, database.name);
          console.log(`DELETED: ${account.name} | ${database.name} | Age: ${ms(Date.now() - Number(timestamp))}`);
        } else {
          console.log(`SKIPPED: ${account.name} | ${database.name} | Age: ${ms(Date.now() - Number(timestamp))}`);
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
    console.error(err);
    process.exit(1);
  });
