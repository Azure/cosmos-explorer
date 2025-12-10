import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import { GREMLIN_CONFIG, deleteDatabase, openAndFillCreateContainerPanel } from "../helpers/containerCreationHelpers";

test.describe("Gremlin API - Graph Creation", () => {
  test("Create graph in new database with non-shared throughput", async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const graphId = generateUniqueName("graph");

    const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

    await openAndFillCreateContainerPanel(explorer, GREMLIN_CONFIG, {
      databaseId,
      containerId: graphId,
      partitionKey: "/pk",
      isAutoscale: true,
      throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    });

    const databaseNode = await explorer.waitForNode(databaseId);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);

    await expect(graphNode.element).toBeAttached();

    // Cleanup
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });

  test("Create graph in new database with shared throughput", async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const graphId = generateUniqueName("graph");

    const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

    await openAndFillCreateContainerPanel(explorer, GREMLIN_CONFIG, {
      databaseId,
      containerId: graphId,
      partitionKey: "/pk",
      useSharedThroughput: true,
    });

    const databaseNode = await explorer.waitForNode(databaseId);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);

    await expect(graphNode.element).toBeAttached();

    // Cleanup
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });

  test("Create graph with autoscale throughput", async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const graphId = generateUniqueName("graph");

    const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

    await openAndFillCreateContainerPanel(explorer, GREMLIN_CONFIG, {
      databaseId,
      containerId: graphId,
      partitionKey: "/pk",
      isAutoscale: true,
      throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    });

    const databaseNode = await explorer.waitForNode(databaseId);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);

    await expect(graphNode.element).toBeAttached();

    // Cleanup
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });

  test("Create graph with manual throughput", async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const graphId = generateUniqueName("graph");
    const manualThroughput = 400;

    const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

    await openAndFillCreateContainerPanel(explorer, GREMLIN_CONFIG, {
      databaseId,
      containerId: graphId,
      partitionKey: "/pk",
      isAutoscale: false,
      throughputValue: manualThroughput,
    });

    const databaseNode = await explorer.waitForNode(databaseId);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);

    await expect(graphNode.element).toBeAttached();

    // Cleanup
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });

  test("Create graph - no unique keys support", async ({ page }) => {
    // Gremlin doesn't support unique keys, verify panel doesn't show unique key UI
    const databaseId = generateUniqueName("db");
    const graphId = generateUniqueName("graph");

    const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

    await explorer.globalCommandButton("New Graph").click();
    await explorer.whilePanelOpen(
      "New Graph",
      async (panel, okButton) => {
        await panel.getByTestId("AddCollectionPanel/DatabaseId").fill(databaseId);
        await panel.getByTestId("AddCollectionPanel/CollectionId").fill(graphId);
        await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
        await panel.getByTestId("ThroughputInput/AutoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

        const uniqueKeyButton = panel.getByTestId("AddCollectionPanel/AddUniqueKeyButton");
        await expect(uniqueKeyButton).not.toBeVisible();

        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const databaseNode = await explorer.waitForNode(databaseId);
    const graphNode = await explorer.waitForContainerNode(databaseId, graphId);
    await expect(graphNode.element).toBeAttached();

    // Cleanup
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });
});
