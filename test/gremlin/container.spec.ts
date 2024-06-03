import { expect, test } from '@playwright/test';

import { DataExplorer, TestAccount, generateDatabaseNameWithTimestamp, generateUniqueName } from '../fx';

test("Gremlin graph CRUD", async ({ page }) => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const graphId = generateUniqueName("graph");

  const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

  // Create new database and graph
  await explorer.commandBarButton("New Graph").click();
  await explorer.whilePanelOpen("New Graph", async (panel, okButton) => {
    await panel.getByPlaceholder('Type a new database id').fill(databaseId);
    await panel.getByRole('textbox', { name: 'Graph id, Example Graph1' }).fill(graphId);
    await panel.getByRole('textbox', { name: 'Partition key' }).fill('/pk');
    await panel.getByLabel('Database max RU/s').fill("1000");
    await okButton.click();
  });

  const databaseNode = explorer.treeNode(`DATA/${databaseId}`);
  await databaseNode.expand();
  const graphNode = explorer.treeNode(`DATA/${databaseId}/${graphId}`);

  await graphNode.openContextMenu();
  await graphNode.contextMenuItem("Delete Graph").click();
  await explorer.whilePanelOpen("Delete Graph", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the graph id" }).fill(graphId);
    await okButton.click();
  });
  await expect(graphNode.element).not.toBeAttached();

  await databaseNode.openContextMenu();
  await databaseNode.contextMenuItem("Delete Database").click();
  await explorer.whilePanelOpen("Delete Database", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the Database id" }).fill(databaseId);
    await okButton.click();
  });

  await expect(databaseNode.element).not.toBeAttached();
});
