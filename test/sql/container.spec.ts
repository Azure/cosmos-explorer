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

test("SQL container with vector embedding policy and embedding source", async ({ page }) => {
  const databaseId = generateUniqueName("vdb");
  const containerId = "testvectorcontainer";

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  // Open the New Container panel and check if the embedding source capability is available
  // before proceeding. We must skip before whilePanelOpen to avoid a timeout on panel close.
  const newContainerButton = await explorer.globalCommandButton("New Container");
  await newContainerButton.click();

  const panel = explorer.panel("New Container");
  await panel.waitFor();

  // Expand vector policy section and add a vector embedding to check for the embedding source accordion
  await panel.getByTestId("ContainerVectorPolicy/Section").click();
  await panel.getByTestId("VectorEmbedding/AddButton").click();

  const embeddingSourceSection = panel.getByTestId("VectorEmbeddingSource/Section/1");
  if ((await embeddingSourceSection.count()) === 0) {
    // Close the panel before skipping
    await panel.getByRole("button", { name: "Close New Container" }).click();
    await panel.waitFor({ state: "detached" });
    test.skip(true, "Test account does not have the integrated embedding capability.");
  }

  await panel.getByPlaceholder("Type a new database id").fill(databaseId);
  await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);
  await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
  await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

  await panel.getByTestId("VectorEmbedding/Path/1").fill("/embedding");
  await panel.getByTestId("VectorEmbedding/Dimensions/1").fill("1536");

  // Expand embedding source section and fill fields
  await embeddingSourceSection.click();

  await panel.getByTestId("VectorEmbeddingSource/SourcePaths/1").fill("/description");
  await panel.getByTestId("VectorEmbeddingSource/DeploymentName/1").fill("text-embedding-3-small");
  await panel.getByTestId("VectorEmbeddingSource/ModelName/1").fill("text-embedding-3-small");
  await panel
    .getByTestId("VectorEmbeddingSource/Endpoint/1")
    .fill("https://e2e-embedding.cognitiveservices.azure.com/");

  const okButton = panel.getByTestId("Panel/OkButton");
  await okButton.click();
  await panel.waitFor({ state: "detached", timeout: 5 * 60 * 1000 });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  // Cleanup
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
