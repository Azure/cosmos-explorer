import { expect, Page, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

/**
 * Tests for Dynamic Data Masking (DDM) feature.
 * 
 * Prerequisites:
 * - Test account must have the EnableDynamicDataMasking capability enabled
 * - If the capability is not enabled, the DataMaskingTab will not be visible and tests will be skipped
 * 
 * Important Notes:
 * - Once DDM is enabled on a container, it cannot be disabled (isPolicyEnabled cannot be set to false)
 * - Tests focus on enabling DDM and modifying the masking policy configuration
 */
test.describe("Data Masking under Scale & Settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer();
  });

  test.beforeEach("Open Data Masking tab under Scale & Settings", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings
    await explorer.openScaleAndSettings(context);

    // Check if Data Masking tab is available (requires EnableDynamicDataMasking capability)
    const dataMaskingTab = explorer.frame.getByTestId("settings-tab-header/DataMaskingTab");
    const isTabVisible = await dataMaskingTab.isVisible().catch(() => false);

    if (!isTabVisible) {
      test.skip(true, "Data Masking tab is not available. Test account may not have EnableDynamicDataMasking capability.");
    }

    await dataMaskingTab.click();
  });

  test.afterAll("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Data Masking editor should be visible", async ({ page }) => {
    // Verify the Data Masking editor is visible
    const dataMaskingEditor = explorer.frame.locator(".settingsV2Editor");
    await expect(dataMaskingEditor).toBeVisible();
  });

  test("Enable data masking policy with valid JSON", async ({ page }) => {
    await clearDataMaskingEditorContent({ page });

    // Type a valid data masking policy
    // Note: Once DDM is enabled on a container, it cannot be disabled
    const validPolicy = JSON.stringify(
      {
        includedPaths: [
          {
            path: "/email",
            strategy: "Default",
            startPosition: 0,
            length: -1,
          },
        ],
        excludedPaths: [],
        isPolicyEnabled: true,
      },
      null,
      2,
    );

    await page.keyboard.type(validPolicy);

    // Wait a moment for the changes to be processed
    await page.waitForTimeout(1000);

    // Click Save button
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Verify success message
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Show validation error for invalid JSON", async ({ page }) => {
    await clearDataMaskingEditorContent({ page });

    // Type invalid JSON
    await page.keyboard.type("{invalid json}");

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // Save button should be disabled due to invalid JSON
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeDisabled();
  });

  test("Update data masking policy with multiple paths", async ({ page }) => {
    await clearDataMaskingEditorContent({ page });

    // Type a policy with multiple included paths and excluded paths
    const multiPathPolicy = JSON.stringify(
      {
        includedPaths: [
          {
            path: "/email",
            strategy: "Default",
            startPosition: 0,
            length: -1,
          },
          {
            path: "/phoneNumber",
            strategy: "Default",
            startPosition: 0,
            length: -1,
          },
        ],
        excludedPaths: ["/id", "/timestamp"],
        isPolicyEnabled: true,
      },
      null,
      2,
    );

    await page.keyboard.type(multiPathPolicy);

    // Wait a moment for the changes to be processed
    await page.waitForTimeout(1000);

    // Click Save button
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Verify success message
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  /**
   * Helper function to clear the data masking editor content.
   */
  const clearDataMaskingEditorContent = async ({ page }: { page: Page }): Promise<void> => {
    // Wait for the Monaco editor to be visible
    await explorer.frame.waitForSelector(".settingsV2Editor", { state: "visible" });
    const dataMaskingEditor = explorer.frame.locator(".settingsV2Editor");
    await dataMaskingEditor.click();

    // Clear existing content (Ctrl+A + Backspace does not work reliably with webkit)
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("Backspace");
    }
  };
});
