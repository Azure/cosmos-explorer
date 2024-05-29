import { expect, test } from "@playwright/test";

import { DataExplorer, TestAccount, generateDatabaseNameWithTimestamp, generateUniqueName } from "../fx";

test("Cassandra keyspace and table CRUD", async ({ page }) => {
  const keyspaceId = generateDatabaseNameWithTimestamp();
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  await explorer.commandBarButton("New Table").click();
  await explorer.whilePanelOpen("Add Table", async (panel, okButton) => {
    await panel.getByPlaceholder("Type a new keyspace id").fill(keyspaceId);
    await panel.getByPlaceholder("Enter table Id").fill(tableId);
    await panel.getByLabel("Table max RU/s").fill("1000");
    await okButton.click();
  });

  const keyspaceNode = explorer.treeNode(`DATA/${keyspaceId}`);
  await expect(keyspaceNode.element).toBeAttached();

  await keyspaceNode.element.click();

  const tableNode = explorer.treeNode(`DATA/${keyspaceId}/${tableId}`);
  await expect(tableNode.element).toBeAttached();

  await tableNode.openContextMenu();
  await tableNode.contextMenuItem("Delete Table").click();
  await explorer.whilePanelOpen("Delete Table", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the table id" }).fill(tableId);
    await okButton.click();
  });
  await expect(tableNode.element).not.toBeAttached();

  await keyspaceNode.openContextMenu();
  await keyspaceNode.contextMenuItem("Delete Keyspace").click();
  await explorer.whilePanelOpen("Delete Keyspace", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the Keyspace id" }).fill(keyspaceId);
    await okButton.click();
  });

  await expect(keyspaceNode.element).not.toBeAttached();
});
