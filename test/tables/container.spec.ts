import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import { TABLES_CONFIG, deleteContainer, openAndFillCreateContainerPanel } from "../helpers/containerCreationHelpers";

test("Tables: CRUD", async ({ page }) => {
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  // Create
  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: tableId,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);
  await expect(tableNode.element).toBeAttached();

  // Delete table
  await deleteContainer(explorer, "TablesDB", tableId, "Delete Table");
  await expect(tableNode.element).not.toBeAttached();
});

test("Tables: New database shared throughput", async ({ page }) => {
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: tableId,
    useSharedThroughput: true,
  });

  const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);
  await expect(tableNode.element).toBeAttached();

  // Cleanup
  await deleteContainer(explorer, "TablesDB", tableId, "Delete Table");
  await expect(tableNode.element).not.toBeAttached();
});

test("Tables: Manual throughput", async ({ page }) => {
  const tableId = generateUniqueName("table");
  const manualThroughput = 400;

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: tableId,
    isAutoscale: false,
    throughputValue: manualThroughput,
  });

  const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);
  await expect(tableNode.element).toBeAttached();

  // Cleanup
  await deleteContainer(explorer, "TablesDB", tableId, "Delete Table");
  await expect(tableNode.element).not.toBeAttached();
});

test("Tables: Multiple tables in TablesDB", async ({ page }) => {
  const table1Id = generateUniqueName("table");
  const table2Id = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  // Create first table
  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: table1Id,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  await explorer.waitForContainerNode("TablesDB", table1Id);

  // Create second table
  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: table2Id,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  await explorer.waitForContainerNode("TablesDB", table2Id);

  // Cleanup
  await deleteContainer(explorer, "TablesDB", table1Id, "Delete Table");
  await deleteContainer(explorer, "TablesDB", table2Id, "Delete Table");
});

test("Tables: No partition key support", async ({ page }) => {
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
    databaseId: "TablesDB",
    containerId: tableId,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);
  await expect(tableNode.element).toBeAttached();

  // Cleanup
  await deleteContainer(explorer, "TablesDB", tableId, "Delete Table");
  await expect(tableNode.element).not.toBeAttached();
});
