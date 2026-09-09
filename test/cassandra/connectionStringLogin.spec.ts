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

const keyspaceId = generateUniqueName("keyspace");
const tableId = "testtable";

async function loginWithConnectionString(page: Page, connectionString: string): Promise<void> {
  await page.goto("https://localhost:1234/hostedExplorer.html");
  const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
  await switchConnectionLink.waitFor();
  await switchConnectionLink.click();
  await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
  await page.getByRole("button", { name: "Connect" }).click();
}

// Builds a Cassandra connection string for an account that the caller controls the name and key of, so
// the tests can point at a wrong key or an account that was never provisioned. The key is embedded raw,
// the way Azure hands it out; URL encoding it would turn the base64 padding into %3D and fail to decode.
function buildCassandraConnectionString(accountName: string, accountKey: string): string {
  return `HostName=${accountName}.cassandra.cosmos.azure.com;Username=${accountName};Password=${accountKey};Port=10350`;
}

// Valid base64 that decodes to 64 zero bytes, matching the length of a real Cosmos account key so the
// request is rejected for being the wrong key rather than for being unparsable.
const wrongAccountKey = "A".repeat(86) + "==";

test.describe("Cassandra account using connection string login", () => {
  let armClient: CosmosDBManagementClient = null!;
  let accountName: string = null!;
  // Cassandra exchanges the connection string for an encrypted token at the Portal Backend rather than
  // signing data-plane requests client-side, so every failure below surfaces as a backend rejection.
  let connectionString: string = null!;

  test.beforeAll("Seed Test Keyspace", async () => {
    const credentials = getAzureCLICredentials();
    armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    accountName = getAccountName(TestAccount.Cassandra);

    const { connectionStrings = [] } = await armClient.databaseAccounts.listConnectionStrings(
      resourceGroupName,
      accountName,
    );

    const cassandraConnectionString = connectionStrings.find((cs) => cs.type === "Cassandra")?.connectionString;
    if (!cassandraConnectionString) {
      throw new Error(`Account ${accountName} did not return a Cassandra connection string`);
    }
    connectionString = cassandraConnectionString;

    await armClient.cassandraResources.beginCreateUpdateCassandraKeyspaceAndWait(
      resourceGroupName,
      accountName,
      keyspaceId,
      { resource: { id: keyspaceId } },
    );
    await armClient.cassandraResources.beginCreateUpdateCassandraTableAndWait(
      resourceGroupName,
      accountName,
      keyspaceId,
      tableId,
      {
        resource: {
          id: tableId,
          schema: {
            columns: [
              { name: "id", type: "text" },
              { name: "value", type: "text" },
            ],
            partitionKeys: [{ name: "id" }],
          },
        },
      },
    );
  });

  test.afterAll("Delete Test Keyspace", async () => {
    await armClient?.cassandraResources.beginDeleteCassandraKeyspaceAndWait(resourceGroupName, accountName, keyspaceId);
  });

  test("creates a row after connection string login", async ({ page }) => {
    await loginWithConnectionString(page, connectionString);

    const explorer = await DataExplorer.waitForExplorer(page);
    const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);
    await expect(tableNode.element).toBeAttached();
    await tableNode.expand();

    const rowsNode = await explorer.waitForNode(`${keyspaceId}/${tableId}/Rows`);
    await rowsNode.element.click();

    const resultsGrid = explorer.frame.getByRole("table", { name: `Results for container ${tableId}`, exact: true });
    await expect(resultsGrid.getByRole("columnheader", { name: "id", exact: true })).toBeAttached({
      timeout: ONE_MINUTE_MS,
    });

    const addRowButton = await explorer.waitForCommandBarButton(CommandBarButton.AddRow, ONE_MINUTE_MS);
    await addRowButton.click();

    const rowId = `${Date.now()}-connstring`;
    const panel = explorer.panel("Add Table Row");
    await panel.waitFor();
    await panel.getByLabel("Edit Property id Value").fill(rowId);
    await panel.getByLabel("Edit Property value Value").fill("connection string login");
    await panel.getByTestId("Panel/OkButton").click();

    await expect(explorer.tab("tab0").getByText(rowId, { exact: true }).nth(0)).toBeVisible({
      timeout: ONE_MINUTE_MS,
    });
  });

  test("exchanges the connection string for an encrypted token", async ({ page }) => {
    // The counterpart of the SQL test that asserts the Portal Backend is never called: Cassandra has no
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
    await loginWithConnectionString(page, buildCassandraConnectionString(accountName, wrongAccountKey));

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
    // account exists, so login succeeds and only the requests made from inside the explorer fail.
    const missingAccountName = `de-test-missing-${new Date().toISOString().replace(/[^0-9]/g, "")}`;
    await loginWithConnectionString(page, buildCassandraConnectionString(missingAccountName, wrongAccountKey));

    await DataExplorer.waitForExplorer(page);

    // The connect form is replaced by the explorer rather than staying up with a login error.
    await expect(page.locator("#connectExplorer")).toHaveCount(0);
    await expect(page.locator(".errorDetails")).toHaveCount(0);
  });
});
