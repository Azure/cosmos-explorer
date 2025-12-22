import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { CosmosClient, CosmosClientOptions, Database } from "@azure/cosmos";
import { AzureIdentityCredentialAdapter } from "@azure/ms-rest-js";
import { Locator, expect, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K,
  TEST_MANUAL_THROUGHPUT_RU,
  TestAccount,
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  resourceGroupName,
  subscriptionId,
} from "../../fx";

// Helper class for database context
class TestDatabaseContext {
  constructor(
    public armClient: CosmosDBManagementClient,
    public client: CosmosClient,
    public database: Database,
  ) {}

  async dispose() {
    await this.database.delete();
  }
}

// Options for creating test database
interface CreateTestDBOptions {
  throughput?: number;
  maxThroughput?: number; // For autoscale
}

// Helper function to create a test database with shared throughput
async function createTestDB(options?: CreateTestDBOptions): Promise<TestDatabaseContext> {
  const databaseId = generateUniqueName("db");
  const credentials = getAzureCLICredentials();
  const adaptedCredentials = new AzureIdentityCredentialAdapter(credentials);
  const armClient = new CosmosDBManagementClient(adaptedCredentials, subscriptionId);
  const accountName = getAccountName(TestAccount.SQL);
  const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);

  const clientOptions: CosmosClientOptions = {
    endpoint: account.documentEndpoint!,
  };

  const nosqlAccountRbacToken = process.env.NOSQL_TESTACCOUNT_TOKEN;
  if (nosqlAccountRbacToken) {
    clientOptions.tokenProvider = async (): Promise<string> => {
      const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
      const authorizationToken = `${AUTH_PREFIX}${nosqlAccountRbacToken}`;
      return authorizationToken;
    };
  } else {
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
    clientOptions.key = keys.primaryMasterKey;
  }

  const client = new CosmosClient(clientOptions);

  // Create database with provisioned throughput (shared throughput)
  // This checks the "Provision database throughput" option
  const { database } = await client.databases.create({
    id: databaseId,
    throughput: options?.throughput, // Manual throughput (e.g., 400)
    maxThroughput: options?.maxThroughput, // Autoscale max throughput (e.g., 1000)
  });

  return new TestDatabaseContext(armClient, client, database);
}

test.describe("Database with Shared Throughput", () => {
  let dbContext: TestDatabaseContext = null!;
  let explorer: DataExplorer = null!;
  const containerId = "sharedcontainer";

  // Helper methods
  const getThroughputInput = (type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input`);
  };

  test.afterEach(async () => {
    // Clean up: delete the created database
    await dbContext?.dispose();
  });

  test.describe("Manual Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared manual throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Verify database node appears in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Add container to shared database without dedicated throughput", async () => {
      // Create database with shared manual throughput
      dbContext = await createTestDB({ throughput: 400 });

      // Wait for the database to appear in the tree
      await explorer.waitForNode(dbContext.database.id);

      // Add a container to the shared database via UI
      await explorer.globalCommandButton("New Container").click();

      await explorer.whilePanelOpen(
        "New Container",
        async (panel, okButton) => {
          // Select "Use existing" database
          const useExistingRadio = panel.getByRole("radio", { name: /Use existing/i });
          await useExistingRadio.click();

          // Select the database from dropdown using the new data-testid
          const databaseDropdown = panel.getByRole("combobox", { name: "Choose an existing database" });
          await databaseDropdown.click();

          await explorer.frame.getByRole("option", { name: dbContext.database.id }).click();
          // Now you can target the specific database option by its data-testid
          //await panel.getByTestId(`database-option-${dbContext.database.id}`).click();
          // Fill container id
          await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);

          // Fill partition key
          await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");

          // Ensure "Provision dedicated throughput" is NOT checked
          const dedicatedThroughputCheckbox = panel.getByRole("checkbox", {
            name: /Provision dedicated throughput for this container/i,
          });

          if (await dedicatedThroughputCheckbox.isVisible()) {
            const isChecked = await dedicatedThroughputCheckbox.isChecked();
            if (isChecked) {
              await dedicatedThroughputCheckbox.uncheck();
            }
          }

          await okButton.click();
        },
        { closeTimeout: 5 * ONE_MINUTE_MS },
      );

      // Verify container was created under the database
      const containerNode = await explorer.waitForContainerNode(dbContext.database.id, containerId);
      expect(containerNode).toBeDefined();
    });

    test("Scale shared database manual throughput", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Navigate to the scale settings by clicking the "Scale" node in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update manual throughput from 400 to 800
      await getThroughputInput("manual").fill(TEST_MANUAL_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });

    test("Scale shared database from manual to autoscale", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Open database settings by clicking the "Scale" node
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Autoscale
      const autoscaleRadio = explorer.frame.getByText("Autoscale", { exact: true });
      await autoscaleRadio.click();

      // Set autoscale max throughput to 1000
      //await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });

  test.describe("Autoscale Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared autoscale throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout

      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Verify database node appears
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Scale shared database autoscale throughput", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update autoscale max throughput from 1000 to 4000
      await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });

    test("Scale shared database from autoscale to manual", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Manual
      const manualRadio = explorer.frame.getByText("Manual", { exact: true });
      await manualRadio.click();

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });
});
