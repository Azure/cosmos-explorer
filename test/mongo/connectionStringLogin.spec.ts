import { Page, expect, test } from "@playwright/test";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import {
    CommandBarButton,
    DataExplorer,
    ONE_MINUTE_MS,
    TestAccount,
    generateUniqueName,
    getAccountName,
    getAzureCLICredentials,
    resourceGroupName,
    subscriptionId,
} from "../fx";

const databaseId = generateUniqueName("db");
const collectionId = "testcollection";

async function loginWithConnectionString(page: Page, connectionString: string): Promise<void> {
  await page.goto("https://localhost:1234/hostedExplorer.html");
  const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
  await switchConnectionLink.waitFor();
  await switchConnectionLink.click();
  await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
  await page.getByRole("button", { name: "Connect" }).click();
}

// Builds a Mongo connection string for an account that the caller controls the name and key of, so the
// tests can point at a wrong key or an account that was never provisioned. The key is embedded raw, the
// way Azure hands it out; URL encoding it would turn the base64 padding into %3D and fail to decode.
function buildMongoConnectionString(accountName: string, accountKey: string): string {
  return `mongodb://${accountName}:${accountKey}@${accountName}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&appName=@${accountName}@`;
}

// Valid base64 that decodes to 64 zero bytes, matching the length of a real Cosmos account key so the
// request is rejected for being the wrong key rather than for being unparsable.
const wrongAccountKey = "A".repeat(86) + "==";

test.describe("Mongo account using connection string login", () => {
  let armClient: CosmosDBManagementClient = null!;
  let accountName: string = null!;
  // Mongo exchanges the connection string for an encrypted token at the Portal Backend rather than
  // signing data-plane requests client-side, so every failure below surfaces as a backend rejection.
  let connectionString: string = null!;

  test.beforeAll("Seed Test Database", async () => {
    const credentials = getAzureCLICredentials();
    armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    accountName = getAccountName(TestAccount.Mongo);

    const { connectionStrings = [] } = await armClient.databaseAccounts.listConnectionStrings(
      resourceGroupName,
      accountName,
    );
    const mongoConnectionString = connectionStrings.find((cs) => cs.type === "MongoDB")?.connectionString;
    if (!mongoConnectionString) {
      throw new Error(`Account ${accountName} did not return a MongoDB connection string`);
    }
    connectionString = mongoConnectionString;

    await armClient.mongoDBResources.beginCreateUpdateMongoDBDatabaseAndWait(
      resourceGroupName,
      accountName,
      databaseId,
      {
        resource: { id: databaseId },
      },
    );
    await armClient.mongoDBResources.beginCreateUpdateMongoDBCollectionAndWait(
      resourceGroupName,
      accountName,
      databaseId,
      collectionId,
      { resource: { id: collectionId, shardKey: { pk: "Hash" } } },
    );
  });

  test.afterAll("Delete Test Database", async () => {
    await armClient?.mongoDBResources.beginDeleteMongoDBDatabaseAndWait(resourceGroupName, accountName, databaseId);
  });

  test("creates a document after connection string login", async ({ page }) => {
    await loginWithConnectionString(page, connectionString);

    const explorer = await DataExplorer.waitForExplorer(page);

    const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);
    await expect(collectionNode.element).toBeAttached();
    await collectionNode.expand();

    // Open the Documents node to load the tab and exercise the data plane, which for Mongo runs through
    // the Portal Backend proxy using the encrypted token issued at login.
    const documentsNode = await explorer.waitForContainerDocumentsNode(databaseId, collectionId);
    await documentsNode.element.click();

    const documentsTab = explorer.documentsTab("tab0");
    await documentsTab.documentsFilter.waitFor();
    await documentsTab.documentsListPane.waitFor();

    // The results editor only mounts once a document is selected, so on this freshly created empty
    // collection it cannot be waited on until New Document is clicked.
    const documentId = `${Date.now()}-connstring`;
    const newDocumentButton = await explorer.waitForCommandBarButton(CommandBarButton.NewDocument, ONE_MINUTE_MS);
    await expect(newDocumentButton).toBeEnabled();
    await newDocumentButton.click();
    await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: ONE_MINUTE_MS });

    // pk matches the shard key the collection was created with.
    await documentsTab.resultsEditor.setText(JSON.stringify({ _id: documentId, pk: documentId }));

    const saveButton = await explorer.waitForCommandBarButton(CommandBarButton.Save, ONE_MINUTE_MS);
    await saveButton.click();
    await expect(saveButton).toBeHidden({ timeout: ONE_MINUTE_MS });

    await expect(documentsTab.documentsListPane.getByText(documentId, { exact: true }).nth(0)).toBeVisible({
      timeout: ONE_MINUTE_MS,
    });
  });

  test("exchanges the connection string for an encrypted token", async ({ page }) => {
    // The counterpart of the SQL test that asserts the Portal Backend is never called: Mongo has no
    // client-side signing path, so the token endpoint has to be hit for login to work at all.
    const tokenCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/connectionstring/token/generatetoken")) {
        tokenCalls.push(request.url());
      }
    });

    await loginWithConnectionString(page, connectionString);

    await DataExplorer.waitForExplorer(page);
    expect(tokenCalls.length).toBeGreaterThan(0);
  });

  test("shows an error when the account key is wrong", async ({ page }) => {
    // Unlike SQL, the Portal Backend validates the key against the account before issuing a token, so
    // login stops at the connect form.
    await loginWithConnectionString(page, buildMongoConnectionString(accountName, wrongAccountKey));

    await expect(page.locator("#connectExplorer")).toBeVisible();
    await expect(page.locator(".errorDetails")).toBeVisible({ timeout: ONE_MINUTE_MS });
    await expect(page.locator(".errorDetails")).not.toBeEmpty();
  });

  test("shows an error when the connection string is malformed", async ({ page }) => {
    await loginWithConnectionString(page, "this-is-not-a-connection-string");

    await expect(page.locator("#connectExplorer")).toBeVisible();
    await expect(page.locator(".errorDetails")).toBeVisible({ timeout: ONE_MINUTE_MS });
    await expect(page.locator(".errorDetails")).not.toBeEmpty();
  });

  test("opens Data Explorer when the account does not exist", async ({ page }) => {
    // The UTC timestamp keeps the account name unique to this run, so it cannot collide with a real
    // account that someone provisioned in the meantime. The token is issued without checking that the
    // account exists, so login succeeds and only the requests made from inside Data Explorer fail.
    const missingAccountName = `de-test-missing-${new Date().toISOString().replace(/[^0-9]/g, "")}`;
    await loginWithConnectionString(page, buildMongoConnectionString(missingAccountName, wrongAccountKey));

    await DataExplorer.waitForExplorer(page);

    // The connect form is replaced by the explorer rather than staying up with a login error.
    await expect(page.locator("#connectExplorer")).toHaveCount(0);
    await expect(page.locator(".errorDetails")).toHaveCount(0);
  });
});
