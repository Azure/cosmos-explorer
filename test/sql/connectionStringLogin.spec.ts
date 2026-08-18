import { Page, expect, test } from "@playwright/test";

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

async function loginWithConnectionString(page: Page, connectionString: string): Promise<void> {
  await page.goto("https://localhost:1234/hostedExplorer.html");
  const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
  await switchConnectionLink.waitFor();
  await switchConnectionLink.click();
  await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
  await page.getByRole("button", { name: "Connect" }).click();
}

test.describe("SQL account using connection string login", () => {
  let database: Database = null!;
  let documentEndpoint: string = null!;
  // SQL signs data-plane requests client-side with the account key, so no encrypted token is issued.
  let connectionString: string = null!;

  test.beforeAll("Seed Test Database", async () => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.SQL, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
    documentEndpoint = account.documentEndpoint!;
    connectionString = `AccountEndpoint=${documentEndpoint};AccountKey=${keys.primaryMasterKey};`;

    const client = new CosmosClient({ endpoint: documentEndpoint, key: keys.primaryMasterKey });
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
    await loginWithConnectionString(page, connectionString);

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
    // A well-formed but incorrect base64 account key (88-char, 64-byte): the endpoint is valid, so the
    // Cosmos client reaches the account but the data-plane request is rejected with 401 Unauthorized.
    const wrongKey = "A".repeat(86) + "==";
    await loginWithConnectionString(page, `AccountEndpoint=${documentEndpoint};AccountKey=${wrongKey};`);

    // The connect form stays visible and surfaces the 401 returned by the account instead of opening Data Explorer.
    await expect(page.locator(".errorDetails")).toContainText("The wrong key is being used", {
      timeout: ONE_MINUTE_MS,
    });
  });

  test("opens the explorer when the connectivity check fails with a non-authorization error", async ({ page }) => {
    // The pre-login connectivity check calls getDatabaseAccount from the top-level hosted explorer frame,
    // which the dev server forwards from the proxy root. Failing only those requests with a 500 simulates a
    // transient or internal service failure while leaving the requests Data Explorer makes from the iframe
    // untouched, so the explorer still talks to the real account once the user is in.
    const failedProxyTargets: string[] = [];
    await page.route(
      (url) => url.pathname === "/proxy",
      async (route) => {
        const request = route.request();
        if (request.frame() !== page.mainFrame()) {
          await route.continue();
          return;
        }

        failedProxyTargets.push(request.headers()["x-ms-proxy-target"]);
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ code: "InternalServerError", message: "The service is temporarily unavailable." }),
        });
      },
    );

    // The account key is correct, so nothing about this login is a credential problem.
    await loginWithConnectionString(page, connectionString);

    // The failed check does not block login: the explorer opens and reads the account through the data plane.
    const explorer = await DataExplorer.waitForExplorer(page);
    const collectionNode = await explorer.waitForContainerNode(databaseId, containerId);
    await expect(collectionNode.element).toBeAttached();

    // The connectivity check ran against the endpoint from the connection string and did fail, and the
    // transient failure was never surfaced to the user as a login error.
    expect(failedProxyTargets).toContain(documentEndpoint);
    await expect(page.locator(".errorDetails")).toHaveCount(0);
  });
});
