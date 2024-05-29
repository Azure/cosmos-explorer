import { expect, test } from "@playwright/test";

import { DataExplorer, TestAccount, generateDatabaseNameWithTimestamp, generateUniqueName } from "../fx";

([
  ["latest API version", TestAccount.Mongo],
  ["3.2 API", TestAccount.Mongo32],
] as [string, TestAccount][]).forEach(([apiVersionDescription, accountType]) => {
  test(`Mongo CRUD using ${apiVersionDescription}`, async ({ page }) => {
    const databaseId = generateDatabaseNameWithTimestamp();
    const collectionId = generateUniqueName("collection");

    const explorer = await DataExplorer.open(page, accountType);

    await explorer.commandBarButton("New Collection").click();
    await explorer.whilePanelOpen("New Collection", async (panel, okButton) => {
      await panel.getByPlaceholder("Type a new database id").fill(databaseId);
      await panel.getByRole("textbox", { name: "Collection id, Example Collection1" }).fill(collectionId);
      await panel.getByRole("textbox", { name: "Shard key" }).fill("pk");
      await panel.getByLabel("Database max RU/s").fill("1000");
      await okButton.click();
    });

    const databaseNode = explorer.treeNode(`DATA/${databaseId}`);
    await expect(databaseNode.element).toBeAttached();

    await databaseNode.element.click();

    const collectionNode = explorer.treeNode(`DATA/${databaseId}/${collectionId}`);
    await expect(collectionNode.element).toBeAttached();

    await collectionNode.openContextMenu();
    await collectionNode.contextMenuItem("Delete Collection").click();
    await explorer.whilePanelOpen("Delete Collection", async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the collection id" }).fill(collectionId);
      await okButton.click();
    });
    await expect(collectionNode.element).not.toBeAttached();

    await databaseNode.openContextMenu();
    await databaseNode.contextMenuItem("Delete Database").click();
    await explorer.whilePanelOpen("Delete Database", async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the Database id" }).fill(databaseId);
      await okButton.click();
    });

    await expect(databaseNode.element).not.toBeAttached();
  });
})