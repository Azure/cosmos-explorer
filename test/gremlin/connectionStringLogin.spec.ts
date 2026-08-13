import { expect, test } from "@playwright/test";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, Database } from "@azure/cosmos";
import {
  DataExplorer,
  Editor,
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
const graphId = "testgraph";
const vertexId = "testvertex";

test.describe("Gremlin account using connection string login", () => {
  let database: Database = null!;

  test.beforeAll("Seed Test Database", async () => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.Gremlin, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);

    // Gremlin graphs are stored as documents, so seed a vertex via the SQL client using Cosmos' internal graph format.
    const client = new CosmosClient({ endpoint: account.documentEndpoint!, key: keys.primaryMasterKey });
    database = (await client.databases.createIfNotExists({ id: databaseId })).database;
    const { container } = await database.containers.createIfNotExists({
      id: graphId,
      partitionKey: { paths: ["/pk"] },
    });
    await container.items.upsert({ id: vertexId, label: "person", pk: "pk1" });
  });

  test.afterAll("Delete Test Database", async () => {
    await database?.delete();
  });

  test("reads a vertex after connection string login", async ({ page }) => {
    const credentials = getAzureCLICredentials();
    const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
    const accountName = getAccountName(TestAccount.Gremlin, TestAuthType.ConnectionString);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);

    // Gremlin signs data-plane requests client-side with the account key, so no encrypted token is issued.
    const connectionString = `AccountEndpoint=${account.documentEndpoint};AccountKey=${keys.primaryMasterKey};ApiKind=Gremlin;`;

    await page.goto("https://localhost:1234/hostedExplorer.html");
    const switchConnectionLink = page.getByTestId("Link:SwitchConnectionType");
    await switchConnectionLink.waitFor();
    await switchConnectionLink.click();
    await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
    await page.getByRole("button", { name: "Connect" }).click();

    const explorer = await DataExplorer.waitForExplorer(page);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);
    await graphNode.expand();

    // Open the Graph node to load the graph explorer, then run the default query to read the seeded vertex.
    const graphDataNode = await explorer.waitForNode(`${databaseId}/${graphId}/Graph`);
    await graphDataNode.element.click();

    await explorer.frame.getByRole("button", { name: "Execute Gremlin Query" }).click();

    // Results open in the Graph view; switch to the JSON view to read the vertex document.
    const jsonResultsTab = explorer.frame.getByRole("tab", { name: "JSON" });
    await jsonResultsTab.waitFor({ timeout: ONE_MINUTE_MS });
    await jsonResultsTab.click();

    const graphJsonEditor = new Editor(
      explorer.frame,
      explorer.frame.locator(".graphJsonEditor").getByTestId("EditorReact/Host/Loaded"),
    );
    await expect.poll(async () => await graphJsonEditor.text(), { timeout: ONE_MINUTE_MS }).toContain(vertexId);
  });
});
