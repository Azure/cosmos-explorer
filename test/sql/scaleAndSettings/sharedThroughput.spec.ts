import { Locator, expect, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K,
  TEST_MANUAL_THROUGHPUT_RU,
  TestAccount,
} from "../../fx";
import { TestDatabaseContext, createTestDB } from "../../testData";

test.describe("Shared Throughput Option Removed from Creation Dialogs", () => {
  let explorer: DataExplorer = null!;

  test.beforeEach(async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);
  });

  test("New Database panel should not show shared throughput checkbox", async () => {
    // Open the "New Database" panel via the global command menu
    const newDatabaseButton = await explorer.globalCommandButton("New Database");
    await newDatabaseButton.click();

    const panel = explorer.panel("New Database");
    await panel.waitFor();

    // Assert that no "Provision throughput" / "Provision shared throughput" checkbox is visible
    const sharedThroughputCheckbox = panel.getByRole("checkbox", {
      name: /Provision.*throughput|Share.*throughput/i,
    });
    await expect(sharedThroughputCheckbox).not.toBeAttached();

    // Close the panel without submitting
    const closeButton = explorer.frame.getByLabel("Close New Database");
    await closeButton.click();
    await panel.waitFor({ state: "detached" });
  });

  test("New Container panel should not show shared throughput checkbox when creating new database", async () => {
    // Open the "New Container" panel
    const newContainerButton = await explorer.globalCommandButton("New Container");
    await newContainerButton.click();

    const panel = explorer.panel("New Container");
    await panel.waitFor();

    // "Create new" database should be selected by default
    const createNewRadio = panel.getByRole("radio", { name: /Create new/i });
    await expect(createNewRadio).toBeChecked();

    // Assert that no "Share throughput across containers" checkbox is visible
    const shareThroughputCheckbox = panel.getByRole("checkbox", {
      name: /Share throughput/i,
    });
    await expect(shareThroughputCheckbox).not.toBeAttached();

    // Close the panel without submitting
    const closeButton = explorer.frame.getByLabel("Close New Container");
    await closeButton.click();
    await panel.waitFor({ state: "detached" });
  });

  test("Dedicated throughput checkbox still appears for existing shared database", async () => {
    // Create a database with shared throughput via SDK
    const dbContext = await createTestDB({ throughput: 400 });

    try {
      // Wait for the database to appear
      await explorer.waitForNode(dbContext.database.id);

      // Open New Container panel
      const newContainerButton = await explorer.globalCommandButton("New Container");
      await newContainerButton.click();

      const panel = explorer.panel("New Container");
      await panel.waitFor();

      // Select "Use existing" and pick the shared database
      const useExistingRadio = panel.getByRole("radio", { name: /Use existing/i });
      await useExistingRadio.click();

      const databaseDropdown = panel.getByRole("combobox", { name: "Choose an existing database" });
      await databaseDropdown.click();
      await explorer.frame.getByRole("option", { name: dbContext.database.id }).click();

      // Assert that "Provision dedicated throughput" checkbox IS visible for a shared database
      const dedicatedThroughputCheckbox = panel.getByRole("checkbox", {
        name: /Provision dedicated throughput/i,
      });
      await expect(dedicatedThroughputCheckbox).toBeVisible();

      // Close the panel without submitting
      const closeButton = explorer.frame.getByLabel("Close New Container");
      await closeButton.click();
      await panel.waitFor({ state: "detached" });
    } finally {
      await dbContext.dispose();
    }
  });
});

test.describe("Database with Shared Throughput", () => {
  let dbContext: TestDatabaseContext = null!;
  let explorer: DataExplorer = null!;
  const containerId = "sharedcontainer";

  // Helper methods
  const getThroughputInput = (type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input`);
  };

  test.afterEach("Delete Test Database", async () => {
    await dbContext?.dispose();
  });

  test.describe("Manual Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared manual throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Verify database node appears in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Add container to shared database without dedicated throughput", async () => {
      // Create database with shared manual throughput
      dbContext = await createTestDB({ throughput: 400 });

      // Wait for the database to appear in the tree
      await explorer.waitForNode(dbContext.database.id);

      // Add a container to the shared database via UI
      const newContainerButton = await explorer.globalCommandButton("New Container");
      await newContainerButton.click();

      await explorer.whilePanelOpen(
        "New Container",
        async (panel, okButton) => {
          // Select "Use existing" database
          const useExistingRadio = panel.getByRole("radio", { name: /Use existing/i });
          await useExistingRadio.click();

          // Select the database from dropdown using the new data-testid
          const databaseDropdown = panel.getByRole("combobox", { name: "Choose an existing database" });
          await databaseDropdown.click();

          await explorer.frame.getByRole("option", { name: dbContext.database.id }).click();
          // Now you can target the specific database option by its data-testid
          //await panel.getByTestId(`database-option-${dbContext.database.id}`).click();
          // Fill container id
          await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);

          // Fill partition key
          await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");

          // Ensure "Provision dedicated throughput" is NOT checked
          const dedicatedThroughputCheckbox = panel.getByRole("checkbox", {
            name: /Provision dedicated throughput for this container/i,
          });

          if (await dedicatedThroughputCheckbox.isVisible()) {
            const isChecked = await dedicatedThroughputCheckbox.isChecked();
            if (isChecked) {
              await dedicatedThroughputCheckbox.uncheck();
            }
          }

          await okButton.click();
        },
        { closeTimeout: 5 * ONE_MINUTE_MS },
      );

      // Verify container was created under the database
      const containerNode = await explorer.waitForContainerNode(dbContext.database.id, containerId);
      expect(containerNode).toBeDefined();
    });

    test("Scale shared database manual throughput", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Navigate to the scale settings by clicking the "Scale" node in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update manual throughput from 400 to 800
      await getThroughputInput("manual").fill(TEST_MANUAL_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });

    test("Scale shared database from manual to autoscale", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Open database settings by clicking the "Scale" node
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Autoscale
      const autoscaleRadio = explorer.frame.getByText("Autoscale", { exact: true });
      await autoscaleRadio.click();

      // Set autoscale max throughput to 1000
      //await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });
  });

  test.describe("Autoscale Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared autoscale throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout

      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Verify database node appears
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Scale shared database autoscale throughput", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update autoscale max throughput from 1000 to 4000
      await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });

    test("Scale shared database from autoscale to manual", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Manual
      const manualRadio = explorer.frame.getByText("Manual", { exact: true });
      await manualRadio.click();

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });
});
