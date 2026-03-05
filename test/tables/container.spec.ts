import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";

test("Tables CRUD", async ({ page }) => {
  const tableId = generateUniqueName("table"); // A unique table name IS needed because the database is shared when using Table Storage.

  const explorer = await DataExplorer.open(page, TestAccount.Tables);

  const newTableButton = explorer.frame.getByTestId("GlobalCommands").getByRole("button", { name: "New Table" });
  await newTableButton.click();
  await explorer.whilePanelOpen(
    "New Table",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Table id, Example Table1" }).fill(tableId);
      await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  const tableNode = await explorer.waitForContainerNode("TablesDB", tableId);

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
