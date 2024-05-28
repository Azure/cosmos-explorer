import { expect, test } from '@playwright/test';

import { generateUniqueName } from "../../test_old/utils/shared";
import { DataExplorer, TestAccount } from '../fx';

test("Cassandra keyspace and table CRUD", async ({ page }) => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  await explorer.commandBarButton("New Table").click();
  await explorer.whilePanelOpen("New Table", async (panel, okButton) => {
    await panel.getByLabel("Keyspace id").click();
    await panel.getByLabel("Keyspace id").fill(keyspaceId);
    await panel.getByLabel("addCollection-table Id Create table").click();
    await panel.getByLabel("addCollection-table Id Create table").fill(tableId);
    await okButton.click();
  });

  const tableNode = explorer.treeNode(tableId);
  await tableNode.element.click();
  await tableNode.openContextMenu();
  await tableNode.contextMenuItem("Delete Table").click();
  await explorer.whilePanelOpen("Delete Table", async (panel, okButton) => {
    await panel.getByTestId("Input:confirmCollectionId").fill(tableId);
    await okButton.click();
  });
  await expect(tableNode.element).not.toBeAttached();

  const keyspaceNode = explorer.treeNode(keyspaceId);
  await keyspaceNode.openContextMenu();
  await keyspaceNode.contextMenuItem("Delete Keyspace").click();
  await explorer.whilePanelOpen("Delete Keyspace", async (panel, okButton) => {
    await panel.getByTestId("Input:confirmDatabaseId").fill(keyspaceId);
    await okButton.click();
  });

  await expect(keyspaceNode.element).not.toBeAttached();
});
