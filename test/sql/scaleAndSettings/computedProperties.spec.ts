import { expect, Page, test } from "@playwright/test";
import * as DataModels from "../../../src/Contracts/DataModels";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Computed Properties", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer();
  });

  test.beforeEach("Open Settings tab under Scale & Settings", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);
    const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.expand();

    // Click Scale & Settings and open Settings tab
    await explorer.openScaleAndSettings(context);
    const computedPropertiesTab = explorer.frame.getByTestId("settings-tab-header/ComputedPropertiesTab");
    await computedPropertiesTab.click();
  });

  test.afterAll("Delete Test Database", async () => {
    if (!process.env.CI) {
      await context?.dispose();
    }
  });

  test("Add valid computed property", async ({ page }) => {
    await clearComputedPropertiesTextBoxContent({ page });

    // Create computed property
    const computedProperties: DataModels.ComputedProperties = [
      {
        name: "cp_lowerName",
        query: "SELECT VALUE LOWER(c.name) FROM c",
      },
    ];
    const computedPropertiesString: string = JSON.stringify(computedProperties);
    await page.keyboard.type(computedPropertiesString);

    // Save changes
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });

  test("Add computed property with invalid query", async ({ page }) => {
    await clearComputedPropertiesTextBoxContent({ page });

    // Create computed property with no VALUE keyword in query
    const computedProperties: DataModels.ComputedProperties = [
      {
        name: "cp_lowerName",
        query: "SELECT LOWER(c.name) FROM c",
      },
    ];
    const computedPropertiesString: string = JSON.stringify(computedProperties);
    await page.keyboard.type(computedPropertiesString);

    // Save changes
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Failed to update container ${context.container.id}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });

  test("Add computed property with invalid json", async ({ page }) => {
    await clearComputedPropertiesTextBoxContent({ page });

    // Create computed property with no VALUE keyword in query
    const computedProperties: DataModels.ComputedProperties = [
      {
        name: "cp_lowerName",
        query: "SELECT LOWER(c.name) FROM c",
      },
    ];
    const computedPropertiesString: string = JSON.stringify(computedProperties);
    await page.keyboard.type(computedPropertiesString + "]");

    // Save button should remain disabled due to invalid json
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeDisabled();
  });

  const clearComputedPropertiesTextBoxContent = async ({ page }: { page: Page }): Promise<void> => {
    // Get computed properties text box
    await explorer.frame.waitForSelector(".monaco-scrollable-element", { state: "visible" });
    const computedPropertiesEditor = explorer.frame.getByTestId("computed-properties-editor");
    await computedPropertiesEditor.click();

    // Clear existing content (Ctrl+A + Backspace does not work with webkit)
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("Backspace");
    }
  };
});
