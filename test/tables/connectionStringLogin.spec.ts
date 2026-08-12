import { expect, test } from "@playwright/test";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { Container, CosmosClient } from "@azure/cosmos";
import {
  DataExplorer,
  ONE_MINUTE_MS,
  TestAccount,
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  resourceGroupName,
  subscriptionId,
} from "../fx";

const tableAccountRbacToken = process.env.TABLE_TESTACCOUNT_TOKEN ?? "";

// Tables API accounts store tables in a fixed "TablesDB" database, with each table as a container.
const databaseId = "TablesDB";
const tableId = generateUniqueName("table");
const partitionKey = "testpartition";
const rowKey = "testrow";

test.describe("Tables account using connection string login", () => {
  let container: Container = null!;

  test.beforeAll("Seed Test Table", async () => {
    if (tableAccountRbacToken.length > 0) {
      return;
    }
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.Tables);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);

    const client = new CosmosClient({ endpoint: account.documentEndpoint!, key: keys.primaryMasterKey });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    container = (
      await database.containers.createIfNotExists({
        id: tableId,
        partitionKey: { paths: ["/'$pk'"] },
      })
    ).container;
    await container.items.upsert({ $pk: partitionKey, id: rowKey, $id: rowKey });
  });

  test.afterAll("Delete Test Table", async () => {
    // Only remove the table we created; the fixed "TablesDB" database is shared by every table in the
    // account, so deleting it would destroy unrelated tables.
    await container?.delete();
  });

  test("reads an entity after connection string login", async ({ page }) => {
    // Connection string (account key) login is not supported when local auth is disabled for data plane RBAC.
    test.skip(tableAccountRbacToken.length > 0);

    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.Tables);
    const { connectionStrings = [] } = await armClient.databaseAccounts.listConnectionStrings(
      resourceGroupName,
      accountName,
    );

    // Tables sign data-plane requests client-side with the account key, so no encrypted token is issued.
    const connectionString = connectionStrings.find((cs) => cs.type === "Table")?.connectionString;

    await page.goto("https://localhost:1234/hostedExplorer.html");
    const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
    await switchConnectionLink.waitFor();
    await switchConnectionLink.click();
    await page.getByPlaceholder("Please enter a connection string").fill(connectionString!);
    await page.getByRole("button", { name: "Connect" }).click();

    const explorer = await DataExplorer.waitForExplorer(page);
    const tableNode = await explorer.waitForContainerNode(databaseId, tableId);
    await tableNode.expand();

    // Open the Entities node to load the table entities grid and read the seeded entity through the data plane.
    const entitiesNode = await explorer.waitForNode(`${databaseId}/${tableId}/Entities`);
    await entitiesNode.element.click();

    const entitiesGrid = explorer.frame.locator("#storageTable");
    await expect(entitiesGrid).toBeVisible({ timeout: ONE_MINUTE_MS });
    await expect(entitiesGrid.getByText(rowKey, { exact: true }).first()).toBeVisible({ timeout: ONE_MINUTE_MS });
    await expect(entitiesGrid.getByText(partitionKey, { exact: true }).first()).toBeVisible();
  });
});
