import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";

test("SQL database and container CRUD", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = "testcontainer"; // A unique container name isn't needed because the database is unique

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  const newContainerButton = await explorer.globalCommandButton("New Container");
  await newContainerButton.click();
  await explorer.whilePanelOpen(
    "New Container",
    async (panel, okButton) => {
      await panel.getByPlaceholder("Type a new database id").fill(databaseId);
      await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);
      await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
      await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("Delete Container").click();
  await explorer.whilePanelOpen(
    "Delete Container",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the container id" }).fill(containerId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
  await expect(containerNode.element).not.toBeAttached();

  await databaseNode.openContextMenu();
  await databaseNode.contextMenuItem("Delete Database").click();
  await explorer.whilePanelOpen(
    "Delete Database",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the database id" }).fill(databaseId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  await expect(databaseNode.element).not.toBeAttached();
});
