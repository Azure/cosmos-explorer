import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";

(
  [
    ["latest API version", TestAccount.Mongo],
    ["3.2 API", TestAccount.Mongo32],
  ] as [string, TestAccount][]
).forEach(([apiVersionDescription, accountType]) => {
  test(`Mongo CRUD using ${apiVersionDescription}`, async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const collectionId = "testcollection"; // A unique collection name isn't needed because the database is unique

    const explorer = await DataExplorer.open(page, accountType);

    const newCollectionButton = await explorer.globalCommandButton("New Collection");
    await newCollectionButton.click();
    await explorer.whilePanelOpen(
      "New Collection",
      async (panel, okButton) => {
        await panel.getByPlaceholder("Type a new database id").fill(databaseId);
        await panel.getByRole("textbox", { name: "Collection id, Example Collection1" }).fill(collectionId);
        await panel.getByRole("textbox", { name: "Shard key" }).fill("pk");
        await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const databaseNode = await explorer.waitForNode(databaseId);
    const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);

    await collectionNode.openContextMenu();
    await collectionNode.contextMenuItem("Delete Collection").click();
    await explorer.whilePanelOpen(
      "Delete Collection",
      async (panel, okButton) => {
        await panel.getByRole("textbox", { name: "Confirm by typing the collection id" }).fill(collectionId);
        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );
    await expect(collectionNode.element).not.toBeAttached();

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
});
