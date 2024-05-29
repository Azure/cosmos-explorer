import { expect, test } from "@playwright/test";

import { DataExplorer, TestAccount, generateDatabaseNameWithTimestamp, generateUniqueName } from "../fx";

test("SQL database and container CRUD", async ({ page }) => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await explorer.commandBarButton("New Container").click();
  await explorer.whilePanelOpen("New Container", async (panel, okButton) => {
    await panel.getByPlaceholder("Type a new database id").fill(databaseId);
    await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);
    await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
    await panel.getByLabel("Database max RU/s").fill("1000");
    await okButton.click();
  });

  const databaseNode = explorer.treeNode(`DATA/${databaseId}`);
  await expect(databaseNode.element).toBeAttached();

  await databaseNode.element.click();

  const containerNode = explorer.treeNode(`DATA/${databaseId}/${containerId}`);
  await expect(containerNode.element).toBeAttached();

  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("Delete Container").click();
  await explorer.whilePanelOpen("Delete Container", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the container id" }).fill(containerId);
    await okButton.click();
  });
  await expect(containerNode.element).not.toBeAttached();

  await databaseNode.openContextMenu();
  await databaseNode.contextMenuItem("Delete Database").click();
  await explorer.whilePanelOpen("Delete Database", async (panel, okButton) => {
    await panel.getByRole("textbox", { name: "Confirm by typing the database id" }).fill(databaseId);
    await okButton.click();
  });

  await expect(databaseNode.element).not.toBeAttached();
});
