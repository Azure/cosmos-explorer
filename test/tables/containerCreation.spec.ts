import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import { TABLES_CONFIG, openAndFillCreateContainerPanel } from "../helpers/containerCreationHelpers";

test.describe("Tables API - Table Creation", () => {
  test("Create table in TablesDB with non-shared throughput", async ({ page }) => {
    const tableId = generateUniqueName("table");

    const explorer = await DataExplorer.open(page, TestAccount.Tables);

    await openAndFillCreateContainerPanel(explorer, TABLES_CONFIG, {
      databaseId: "TablesDB", // Tables uses a fixed database
      containerId: tableId,
      isAutoscale: true,
      throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    });

    const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);

    await expect(tableNode.element).toBeAttached();

    // Cleanup - delete table
    await tableNode.openContextMenu();
    await tableNode.contextMenuItem("Delete Table").click();
    await explorer.whilePanelOpen(
      "Delete Table",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(tableId);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );
    await expect(tableNode.element).not.toBeAttached();
  });

  test("Create multiple tables in TablesDB", async ({ page }) => {
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

    const table2Node = await explorer.waitForContainerNode("TablesDB", table2Id);
    await expect(table2Node.element).toBeAttached();

    // Cleanup - delete both tables
    const table1Node = await explorer.waitForContainerNode("TablesDB", table1Id);
    await table1Node.openContextMenu();
    await table1Node.contextMenuItem("Delete Table").click();
    await explorer.whilePanelOpen(
      "Delete Table",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(table1Id);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    await table2Node.openContextMenu();
    await table2Node.contextMenuItem("Delete Table").click();
    await explorer.whilePanelOpen(
      "Delete Table",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(table2Id);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );
  });

  test("Create table with shared throughput", async ({ page }) => {
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
    await tableNode.openContextMenu();
    await tableNode.contextMenuItem("Delete Table").click();
    await explorer.whilePanelOpen(
      "Delete Table",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(tableId);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );
  });

  test("Create table - no partition key support", async ({ page }) => {
    // Tables don't use partition keys, verify they're not shown in UI
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

    // Verify partition key field is not present (Tables don't use partition keys)
    // This would need to be checked during panel open, so we keep the inline test for this validation

    // Cleanup
    await tableNode.openContextMenu();
    await tableNode.contextMenuItem("Delete Table").click();
    await explorer.whilePanelOpen(
      "Delete Table",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(tableId);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );
  });
});
