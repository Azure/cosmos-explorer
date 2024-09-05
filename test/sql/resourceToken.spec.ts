import { expect, test } from "@playwright/test";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, PermissionMode } from "@azure/cosmos";
import {
  DataExplorer,
  TestAccount,
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  resourceGroupName,
  subscriptionId,
} from "../fx";

// This test is currently failing because of issues with resource token auth in the backend.
// Marking it as 'fail' means that it will still be run, but Playwright's reporting will be inverted (failing tests will be marked as passing and vice versa).
// This allows us to detect when it starts working again, as the test will fail again.
// At that point, we can remove the 'fail' marker and continue running the test as normal.
test.fail("SQL account using Resource token", async ({ page }) => {
  const credentials = await getAzureCLICredentials();
  const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
  const accountName = getAccountName(TestAccount.SQL);
  const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
  const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
  const dbId = generateUniqueName("db");
  const collectionId = "testcollection";
  const client = new CosmosClient({
    endpoint: account.documentEndpoint!,
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
  await expect(containerPermission).toBeDefined();

  const resourceTokenConnectionString = `AccountEndpoint=${account.documentEndpoint};DatabaseId=${database.id};CollectionId=${container.id};${containerPermission!._token}`;

  await page.goto("https://localhost:1234/hostedExplorer.html");
  const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
  await switchConnectionLink.waitFor();
  await switchConnectionLink.click();
  await page.getByPlaceholder("Please enter a connection string").fill(resourceTokenConnectionString);
  await page.getByRole("button", { name: "Connect" }).click();

  const explorer = await DataExplorer.waitForExplorer(page);

  const collectionNode = explorer.treeNode(`${collectionId}`);
  await collectionNode.element.waitFor();
  await expect(collectionNode.element).toBeAttached();

  await database.delete();
});
