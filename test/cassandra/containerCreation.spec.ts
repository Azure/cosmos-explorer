import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import { deleteKeyspace, fillCassandraTableDetails, setThroughput } from "../helpers/containerCreationHelpers";

test.describe("Cassandra API - Keyspace and Table Creation", () => {
  test("Create table in new keyspace with non-shared throughput", async ({ page }) => {
    const keyspaceId = generateUniqueName("keyspace");
    const tableId = generateUniqueName("table");

    const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

    await explorer.globalCommandButton("New Table").click();
    await explorer.whilePanelOpen(
      "Add Table",
      async (panel, okButton) => {
        await fillCassandraTableDetails(panel, keyspaceId, tableId);
        await setThroughput(panel, true, TEST_AUTOSCALE_THROUGHPUT_RU);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const keyspaceNode = await explorer.waitForNode(keyspaceId);
    const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);

    await expect(tableNode.element).toBeAttached();

    // Cleanup
    await deleteKeyspace(explorer, keyspaceId);
    await expect(keyspaceNode.element).not.toBeAttached();
  });

  test("Create table in new keyspace with shared throughput", async ({ page }) => {
    const keyspaceId = generateUniqueName("keyspace");
    const tableId = generateUniqueName("table");

    const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

    await explorer.globalCommandButton("New Table").click();
    await explorer.whilePanelOpen(
      "Add Table",
      async (panel, okButton) => {
        await fillCassandraTableDetails(panel, keyspaceId, tableId);
        await panel
          .getByTestId("AddCollectionPanel/SharedThroughputCheckbox")
          .getByRole("checkbox")
          .check({ force: true });
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const keyspaceNode = await explorer.waitForNode(keyspaceId);
    const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);

    await expect(tableNode.element).toBeAttached();

    // Cleanup
    await deleteKeyspace(explorer, keyspaceId);
    await expect(keyspaceNode.element).not.toBeAttached();
  });

  test("Create table with autoscale throughput", async ({ page }) => {
    const keyspaceId = generateUniqueName("keyspace");
    const tableId = generateUniqueName("table");

    const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

    await explorer.globalCommandButton("New Table").click();
    await explorer.whilePanelOpen(
      "Add Table",
      async (panel, okButton) => {
        await fillCassandraTableDetails(panel, keyspaceId, tableId);
        await setThroughput(panel, true, TEST_AUTOSCALE_THROUGHPUT_RU);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);
    await expect(tableNode.element).toBeAttached();

    // Cleanup
    await deleteKeyspace(explorer, keyspaceId);
  });

  test("Create table with manual throughput", async ({ page }) => {
    const keyspaceId = generateUniqueName("keyspace");
    const tableId = generateUniqueName("table");
    const manualThroughput = 400;

    const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

    await explorer.globalCommandButton("New Table").click();
    await explorer.whilePanelOpen(
      "Add Table",
      async (panel, okButton) => {
        await fillCassandraTableDetails(panel, keyspaceId, tableId);
        await setThroughput(panel, false, manualThroughput);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);
    await expect(tableNode.element).toBeAttached();

    // Cleanup
    await deleteKeyspace(explorer, keyspaceId);
  });

  test("Create multiple tables in keyspace", async ({ page }) => {
    const keyspaceId = generateUniqueName("keyspace");
    const table1Id = generateUniqueName("table");

    const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

    // Create first table
    await explorer.globalCommandButton("New Table").click();
    await explorer.whilePanelOpen(
      "Add Table",
      async (panel, okButton) => {
        await fillCassandraTableDetails(panel, keyspaceId, table1Id);
        await setThroughput(panel, true, TEST_AUTOSCALE_THROUGHPUT_RU);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const keyspaceNode = await explorer.waitForNode(keyspaceId);
    await explorer.waitForContainerNode(keyspaceId, table1Id);

    // Cleanup
    await deleteKeyspace(explorer, keyspaceId);
    await expect(keyspaceNode.element).not.toBeAttached();
  });
});
