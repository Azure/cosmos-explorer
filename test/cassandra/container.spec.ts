import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";

test("Cassandra keyspace and table CRUD", async ({ page }) => {
  const keyspaceId = generateUniqueName("db");
  const tableId = "testtable"; // A unique table name isn't needed because the keyspace is unique

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  await explorer.globalCommandButton("New Table").click();
  await explorer.whilePanelOpen(
    "Add Table",
    async (panel, okButton) => {
      await panel.getByPlaceholder("Type a new keyspace id").fill(keyspaceId);
      await panel.getByPlaceholder("Enter table Id").fill(tableId);
      await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);

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

  await keyspaceNode.openContextMenu();
  await keyspaceNode.contextMenuItem("Delete Keyspace").click();
  await explorer.whilePanelOpen(
    "Delete Keyspace",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the Keyspace id" }).fill(keyspaceId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  await expect(keyspaceNode.element).not.toBeAttached();
});
