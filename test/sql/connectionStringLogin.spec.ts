import { expect, test } from "@playwright/test";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, Database } from "@azure/cosmos";
import {
  DataExplorer,
  ONE_MINUTE_MS,
  TestAccount,
  TestAuthType,
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  resourceGroupName,
  subscriptionId,
} from "../fx";

const databaseId = generateUniqueName("db");
const containerId = "testcontainer";
const documentId = "testdoc1";

test.describe("SQL account using connection string login", () => {
  let database: Database = null!;

  test.beforeAll("Seed Test Database", async () => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.SQL, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);

    const client = new CosmosClient({ endpoint: account.documentEndpoint!, key: keys.primaryMasterKey });
    database = (await client.databases.createIfNotExists({ id: databaseId })).database;
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/id"] },
    });
    await container.items.upsert({ id: documentId });
  });

  test.afterAll("Delete Test Database", async () => {
    await database?.delete();
  });

  test("reads a document after connection string login", async ({ page }) => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.SQL, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);

    // SQL signs data-plane requests client-side with the account key, so no encrypted token is issued.
    const connectionString = `AccountEndpoint=${account.documentEndpoint};AccountKey=${keys.primaryMasterKey};`;

    await page.goto("https://localhost:1234/hostedExplorer.html");
    const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
    await switchConnectionLink.waitFor();
    await switchConnectionLink.click();
    await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
    await page.getByRole("button", { name: "Connect" }).click();

    const explorer = await DataExplorer.waitForExplorer(page);
    const collectionNode = await explorer.waitForContainerNode(databaseId, containerId);
    await expect(collectionNode.element).toBeAttached();
    await collectionNode.expand();

    // Open the Items node to load the Documents tab and read the seeded document through the data plane.
    const itemsNode = await explorer.waitForContainerItemsNode(databaseId, containerId);
    await itemsNode.element.click();

    const documentsTab = explorer.documentsTab("tab0");
    await documentsTab.documentsFilter.waitFor();
    await documentsTab.documentsListPane.waitFor();
    await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: ONE_MINUTE_MS });

    const documentRow = documentsTab.documentsListPane.getByText(documentId, { exact: true }).nth(0);
    await documentRow.waitFor();
    await documentRow.click();
    await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: ONE_MINUTE_MS });

    const resultText = await documentsTab.resultsEditor.text();
    expect(resultText).not.toBeNull();
    const resultData = JSON.parse(resultText!);
    expect(resultData?.id).toEqual(documentId);
  });

  test("shows an error when the connection string has the wrong account key", async ({ page }) => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.SQL, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);

    // A well-formed but incorrect base64 account key (88-char, 64-byte): the endpoint is valid, so the
    // Cosmos client reaches the account but the data-plane request is rejected with 401 Unauthorized.
    const wrongKey = "A".repeat(86) + "==";
    const connectionString = `AccountEndpoint=${account.documentEndpoint};AccountKey=${wrongKey};`;

    await page.goto("https://localhost:1234/hostedExplorer.html");
    const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
    await switchConnectionLink.waitFor();
    await switchConnectionLink.click();
    await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
    await page.getByRole("button", { name: "Connect" }).click();

    // The connect form stays visible and surfaces the connectivity error instead of opening the explorer.
    await expect(page.locator(".errorDetails")).toContainText("Unable to connect to the account", {
      timeout: ONE_MINUTE_MS,
    });
  });
});
