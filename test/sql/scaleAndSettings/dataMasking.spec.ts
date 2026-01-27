import { expect, test, type Page } from "@playwright/test";
import { DataExplorer, TestAccount } from "../../fx";
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

let testContainer: TestContainerContext;
let DATABASE_ID: string;
let CONTAINER_ID: string;

test.beforeAll(async () => {
  testContainer = await createTestSQLContainer();
  DATABASE_ID = testContainer.database.id;
  CONTAINER_ID = testContainer.container.id;
});

// Clean up test database after all tests
test.afterAll(async () => {
  if (testContainer) {
    await testContainer.dispose();
  }
});

// Helper function to navigate to Data Masking tab
async function navigateToDataMaskingTab(page: Page, explorer: DataExplorer): Promise<boolean> {
  // Refresh the tree to see the newly created database
  const refreshButton = explorer.frame.getByTestId("Sidebar/RefreshButton");
  await refreshButton.click();
  await page.waitForTimeout(3000);

  // Expand database and container nodes
  const databaseNode = await explorer.waitForNode(DATABASE_ID);
  await databaseNode.expand();
  await page.waitForTimeout(2000);

  const containerNode = await explorer.waitForNode(`${DATABASE_ID}/${CONTAINER_ID}`);
  await containerNode.expand();
  await page.waitForTimeout(1000);

  // Click Scale & Settings or Settings (depending on container type)
  let settingsNode = explorer.frame.getByTestId(`TreeNode:${DATABASE_ID}/${CONTAINER_ID}/Scale & Settings`);
  const isScaleAndSettings = await settingsNode.isVisible().catch(() => false);

  if (!isScaleAndSettings) {
    settingsNode = explorer.frame.getByTestId(`TreeNode:${DATABASE_ID}/${CONTAINER_ID}/Settings`);
  }

  await settingsNode.click();
  await page.waitForTimeout(2000);

  // Check if Data Masking tab is available
  const dataMaskingTab = explorer.frame.getByTestId("settings-tab-header/DataMaskingTab");
  const isTabVisible = await dataMaskingTab.isVisible().catch(() => false);

  if (!isTabVisible) {
    return false;
  }

  await dataMaskingTab.click();
  await page.waitForTimeout(1000);
  return true;
}

test.describe("Data Masking under Scale & Settings", () => {
  test("Data Masking tab should be visible and show JSON editor", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const isTabAvailable = await navigateToDataMaskingTab(page, explorer);

    if (!isTabAvailable) {
      test.skip(
        true,
        "Data Masking tab is not available. Test account may not have EnableDynamicDataMasking capability.",
      );
    }

    // Verify the Data Masking editor is visible
    const dataMaskingEditor = explorer.frame.locator(".settingsV2Editor");
    await expect(dataMaskingEditor).toBeVisible();
  });

  test("Data Masking editor should contain default policy structure", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const isTabAvailable = await navigateToDataMaskingTab(page, explorer);

    if (!isTabAvailable) {
      test.skip(
        true,
        "Data Masking tab is not available. Test account may not have EnableDynamicDataMasking capability.",
      );
    }

    // Verify the editor contains the expected JSON structure fields
    const editorContent = explorer.frame.locator(".settingsV2Editor");
    await expect(editorContent).toBeVisible();

    // Check that the editor contains key policy fields (default policy has empty arrays)
    await expect(editorContent).toContainText("includedPaths");
    await expect(editorContent).toContainText("excludedPaths");
    await expect(editorContent).toContainText("isPolicyEnabled");
  });

  test("Data Masking editor should have correct default policy values", async ({ page }) => {
    const explorer = await DataExplorer.open(page, TestAccount.SQL);
    const isTabAvailable = await navigateToDataMaskingTab(page, explorer);

    if (!isTabAvailable) {
      test.skip(
        true,
        "Data Masking tab is not available. Test account may not have EnableDynamicDataMasking capability.",
      );
    }

    const editorContent = explorer.frame.locator(".settingsV2Editor");
    await expect(editorContent).toBeVisible();

    // Default policy should have isPolicyEnabled set to true
    await expect(editorContent).toContainText("true");
    // Default policy should have empty includedPaths and excludedPaths arrays
    await expect(editorContent).toContainText("[]");
  });
});
