import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";

test("Gremlin graph CRUD", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const graphId = "testgraph"; // A unique graph name isn't needed because the database is unique

  const explorer = await DataExplorer.open(page, TestAccount.Gremlin);

  // Create new database and graph
  const newGraphButton = await explorer.globalCommandButton("New Graph");
  await newGraphButton.click();
  await explorer.whilePanelOpen(
    "New Graph",
    async (panel, okButton) => {
      await panel.getByPlaceholder("Type a new database id").fill(databaseId);
      await panel.getByRole("textbox", { name: "Graph id, Example Graph1" }).fill(graphId);
      await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
      await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  const databaseNode = await explorer.waitForNode(databaseId);
  const graphNode = await explorer.waitForContainerNode(databaseId, graphId);

  await graphNode.openContextMenu();
  await graphNode.contextMenuItem("Delete Graph").click();
  await explorer.whilePanelOpen(
    "Delete Graph",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the graph id" }).fill(graphId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
  await expect(graphNode.element).not.toBeAttached();

  await databaseNode.openContextMenu();
  await databaseNode.contextMenuItem("Delete Database").click();
  await explorer.whilePanelOpen(
    "Delete Database",
    async (panel, okButton) => {
      await panel.getByRole("textbox", { name: "Confirm by typing the Database id" }).fill(databaseId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );

  await expect(databaseNode.element).not.toBeAttached();
});
