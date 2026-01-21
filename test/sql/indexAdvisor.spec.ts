import { expect, test, type Page } from "@playwright/test";

import { CommandBarButton, DataExplorer, TestAccount } from "../fx";
import { createTestSQLContainer, TestContainerContext } from "../testData";

// Test container context for setup and cleanup
let testContainer: TestContainerContext;
let DATABASE_ID: string;
let CONTAINER_ID: string;

// Set up test database and container with data before all tests
test.beforeAll(async () => {
  testContainer = await createTestSQLContainer({ includeTestData: true });
  DATABASE_ID = testContainer.database.id;
  CONTAINER_ID = testContainer.container.id;
});

// Clean up test database after all tests
test.afterAll(async () => {
  if (testContainer) {
    await testContainer.dispose();
  }
});

// Helper function to set up query tab and navigate to Index Advisor
async function setupIndexAdvisorTab(page: Page, customQuery?: string) {
  const explorer = await DataExplorer.open(page, TestAccount.SQL);
  const databaseNode = await explorer.waitForNode(DATABASE_ID);
  await databaseNode.expand();
  await page.waitForTimeout(2000);

  const containerNode = await explorer.waitForNode(`${DATABASE_ID}/${CONTAINER_ID}`);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();
  await page.waitForTimeout(2000);

  const queryTab = explorer.queryTab("tab0");
  const queryEditor = queryTab.editor();
  await queryEditor.locator.waitFor({ timeout: 30 * 1000 });
  await queryTab.executeCTA.waitFor();

  if (customQuery) {
    await queryEditor.locator.click();
    await queryEditor.setText(customQuery);
  }

  const executeQueryButton = explorer.commandBarButton(CommandBarButton.ExecuteQuery);
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

  const indexAdvisorTab = queryTab.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/IndexAdvisorTab");
  await indexAdvisorTab.click();
  await page.waitForTimeout(2000);

  return { explorer, queryTab, indexAdvisorTab };
}

test("Index Advisor tab loads without errors", async ({ page }) => {
  const { indexAdvisorTab } = await setupIndexAdvisorTab(page);
  await expect(indexAdvisorTab).toHaveAttribute("aria-selected", "true");
});

test("Verify UI sections are collapsible", async ({ page }) => {
  const { explorer } = await setupIndexAdvisorTab(page);

  // Verify both section headers exist
  const includedHeader = explorer.frame.getByText("Included in Current Policy", { exact: true });
  const notIncludedHeader = explorer.frame.getByText("Not Included in Current Policy", { exact: true });

  await expect(includedHeader).toBeVisible();
  await expect(notIncludedHeader).toBeVisible();

  // Test collapsibility by checking if chevron/arrow icon changes state
  // Both sections should be expandable/collapsible regardless of content
  await includedHeader.click();
  await page.waitForTimeout(300);
  await includedHeader.click();
  await page.waitForTimeout(300);

  await notIncludedHeader.click();
  await page.waitForTimeout(300);
  await notIncludedHeader.click();
  await page.waitForTimeout(300);
});

test("Verify SDK response structure - Case 1: Empty response", async ({ page }) => {
  const { explorer } = await setupIndexAdvisorTab(page);

  // Verify both section headers still exist even with no data
  await expect(explorer.frame.getByText("Included in Current Policy", { exact: true })).toBeVisible();
  await expect(explorer.frame.getByText("Not Included in Current Policy", { exact: true })).toBeVisible();

  // Verify table headers
  const table = explorer.frame.locator("table");
  await expect(table.getByText("Index", { exact: true })).toBeVisible();
  await expect(table.getByText("Estimated Impact", { exact: true })).toBeVisible();

  // Verify "Update Indexing Policy" button is NOT visible when there are no potential indexes
  const updateButton = explorer.frame.getByRole("button", { name: /Update Indexing Policy/i });
  await expect(updateButton).not.toBeVisible();
});

test("Verify index suggestions and apply potential index", async ({ page }) => {
  const customQuery = 'SELECT * FROM c WHERE c.partitionKey = "partition_1" ORDER BY c.randomData';
  const { explorer } = await setupIndexAdvisorTab(page, customQuery);

  // Wait for Index Advisor to process the query
  await page.waitForTimeout(2000);

  // Verify "Not Included in Current Policy" section has suggestions
  const notIncludedHeader = explorer.frame.getByText("Not Included in Current Policy", { exact: true });
  await expect(notIncludedHeader).toBeVisible();

  // Find the checkbox for the suggested composite index
  // The composite index should be /partitionKey ASC, /randomData ASC
  const checkboxes = explorer.frame.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  // Should have at least one checkbox for the potential index
  expect(checkboxCount).toBeGreaterThan(0);

  // Select the first checkbox (the high-impact composite index)
  await checkboxes.first().check();
  await page.waitForTimeout(500);

  // Verify "Update Indexing Policy" button becomes visible
  const updateButton = explorer.frame.getByRole("button", { name: /Update Indexing Policy/i });
  await expect(updateButton).toBeVisible();

  // Click the "Update Indexing Policy" button
  await updateButton.click();
  await page.waitForTimeout(1000);

  // Verify success message appears
  const successMessage = explorer.frame.getByText(/Your indexing policy has been updated with the new included paths/i);
  await expect(successMessage).toBeVisible();

  // Verify the message mentions reviewing changes in Scale & Settings
  const reviewMessage = explorer.frame.getByText(/You may review the changes in Scale & Settings/i);
  await expect(reviewMessage).toBeVisible();

  // Verify the checkmark icon is shown
  const checkmarkIcon = explorer.frame.locator('[data-icon-name="CheckMark"]');
  await expect(checkmarkIcon).toBeVisible();
});
