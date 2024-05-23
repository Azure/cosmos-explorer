import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, PermissionMode } from "@azure/cosmos";
import { jest } from "@jest/globals";
import "expect-playwright";
import { generateUniqueName, getAzureCLICredentials } from "../utils/shared";
jest.setTimeout(120000);

const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"] ?? "";
const resourceGroupName = "runners";

test("Resource token", async () => {
  const credentials = await getAzureCLICredentials();
  const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
  const account = await armClient.databaseAccounts.get(resourceGroupName, "portal-sql-runner-west-us");
  const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, "portal-sql-runner-west-us");
  const dbId = generateUniqueName("db");
  const collectionId = generateUniqueName("col");
  const client = new CosmosClient({
    endpoint: account.documentEndpoint,
    key: keys.primaryMasterKey,
  });
  const { database } = await client.databases.createIfNotExists({ id: dbId });
  const { container } = await database.containers.createIfNotExists({ id: collectionId });
  const { user } = await database.users.upsert({ id: "testUser" });
  const { resource: containerPermission } = await user.permissions.upsert({
    id: "partitionLevelPermission",
    permissionMode: PermissionMode.All,
    resource: container.url,
  });
  const resourceTokenConnectionString = `AccountEndpoint=${account.documentEndpoint};DatabaseId=${database.id};CollectionId=${container.id};${containerPermission._token}`;

  await page.goto("https://localhost:1234/hostedExplorer.html");
  await page.waitForSelector("div > p.switchConnectTypeText");
  await page.click("div > p.switchConnectTypeText");
  await page.type("input[class='inputToken']", resourceTokenConnectionString);
  await page.click("input[value='Connect']");
  await page.waitForSelector("iframe");
  const explorer = await page.frame({
    name: "explorer",
  });
  await explorer.textContent(`css=.dataResourceTree >> "${collectionId}"`);
});
