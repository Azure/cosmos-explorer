import { expect, test } from "@playwright/test";

import {
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_THROUGHPUT_RU,
  TestAccount,
  generateUniqueName,
  getDropdownItemByNameOrPosition,
} from "../fx";

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

test.describe("Vector embedding quantizer type in New Container panel", () => {
  /**
   * Opens the New Container panel and expands the Container Vector Policy section.
   * Returns the panel locator and the scoped vector policy content locator.
   */
  const openPanelWithVectorPolicy = async (explorer: DataExplorer) => {
    const newContainerButton = await explorer.globalCommandButton("New Container");
    await newContainerButton.click();

    const panel = explorer.panel("New Container");
    await panel.waitFor();

    // Expand section via its stable data-test id (avoids matching localized title text)
    await explorer.frame.getByTestId("container-vector-policy-section").click();

    const vectorSection = explorer.frame.locator("#collapsibleVectorPolicySectionContent");
    await vectorSection.locator("#add-vector-policy").waitFor();

    return { panel, vectorSection };
  };

  /** Closes the New Container panel without submitting via the Fluent UI Panel close button. */
  const closePanel = async (explorer: DataExplorer) => {
    await explorer.frame.locator("button.ms-Panel-closeButton").click();
    await explorer.panel("New Container").waitFor({ state: "detached" });
  };

  test("Quantizer type dropdown is disabled by default when index type is none", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const { vectorSection } = await openPanelWithVectorPolicy(explorer);

    await vectorSection.locator("#add-vector-policy").click();

    // Index type defaults to "none" — quantizer type must be disabled
    const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
    await expect(quantizerDropdownBtn).toBeDisabled();

    await closePanel(explorer);
  });

  test("Quantizer type dropdown is disabled for flat index type", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const { vectorSection } = await openPanelWithVectorPolicy(explorer);

    await vectorSection.locator("#add-vector-policy").click();

    // Select "flat" index type (does not support quantization).
    // Use exact match because "flat" is also a substring of "quantizedFlat".
    await vectorSection.locator("#vector-policy-indexType-1").click();
    await explorer.frame.getByRole("option", { name: "flat", exact: true }).click();

    const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
    await expect(quantizerDropdownBtn).toBeDisabled();

    await closePanel(explorer);
  });

  test("Quantizer type dropdown becomes enabled with diskANN index type and defaults to Product", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const { vectorSection } = await openPanelWithVectorPolicy(explorer);

    await vectorSection.locator("#add-vector-policy").click();

    await vectorSection.locator("#vector-policy-indexType-1").click();
    await (await getDropdownItemByNameOrPosition(explorer.frame, { name: "diskANN" })).click();

    const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
    await expect(quantizerDropdownBtn).toBeEnabled();
    await expect(quantizerDropdownBtn).toContainText("Product");

    await closePanel(explorer);
  });

  test("Quantizer type dropdown becomes enabled with quantizedFlat index type and defaults to Product", async ({
    page,
  }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const { vectorSection } = await openPanelWithVectorPolicy(explorer);

    await vectorSection.locator("#add-vector-policy").click();

    // Select "quantizedFlat" index type — supports quantization
    await vectorSection.locator("#vector-policy-indexType-1").click();
    await (await getDropdownItemByNameOrPosition(explorer.frame, { name: "quantizedFlat" })).click();

    const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
    await expect(quantizerDropdownBtn).toBeEnabled();
    await expect(quantizerDropdownBtn).toContainText("Product");

    await closePanel(explorer);
  });

  test("Quantizer type can be changed to Spherical (Preview)", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const { vectorSection } = await openPanelWithVectorPolicy(explorer);

    await vectorSection.locator("#add-vector-policy").click();

    await vectorSection.locator("#vector-policy-indexType-1").click();
    await (await getDropdownItemByNameOrPosition(explorer.frame, { name: "diskANN" })).click();

    const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
    await quantizerDropdownBtn.click();
    await (await getDropdownItemByNameOrPosition(explorer.frame, { position: 1 })).click();

    await expect(quantizerDropdownBtn).not.toContainText("Product");

    await closePanel(explorer);
  });

  test("Creating a container with diskANN index type and Spherical quantizer type succeeds", async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const containerId = "testvecquantizer";
    const explorer = await DataExplorer.open(page, TestAccount.SQL);

    await (await explorer.globalCommandButton("New Container")).click();

    await explorer.whilePanelOpen(
      "New Container",
      async (panel, okButton) => {
        await panel.getByPlaceholder("Type a new database id").fill(databaseId);
        await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);
        await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");
        await panel.getByTestId("autoscaleRUInput").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

        await explorer.frame.getByTestId("container-vector-policy-section").click();
        const vectorSection = explorer.frame.locator("#collapsibleVectorPolicySectionContent");
        await vectorSection.locator("#add-vector-policy").waitFor();

        await vectorSection.locator("#add-vector-policy").click();
        await vectorSection.locator("#vector-policy-path-1").fill("/embedding");
        await vectorSection.locator("#vector-policy-dimension-1").fill("1536");

        await vectorSection.locator("#vector-policy-indexType-1").click();
        await (await getDropdownItemByNameOrPosition(explorer.frame, { name: "diskANN" })).click();

        const quantizerDropdownBtn = vectorSection.locator("#vector-policy-quantizerType-1");
        await expect(quantizerDropdownBtn).toBeEnabled();
        await quantizerDropdownBtn.click();
        await (await getDropdownItemByNameOrPosition(explorer.frame, { position: 1 })).click();

        await okButton.click();
      },
      { closeTimeout: 5 * 60 * 1000 },
    );

    const containerNode = await explorer.waitForContainerNode(databaseId, containerId);
    await expect(containerNode.element).toBeVisible();

    // Cleanup
    const databaseNode = await explorer.waitForNode(databaseId);
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
    await expect(databaseNode.element).not.toBeAttached({ timeout: ONE_MINUTE_MS });
  });
});
