import { expect, test } from "@playwright/test";

import { DataExplorer, TestAccount } from "../fx";

// Using existing database and container from environment variables
// Set these in your test environment or they'll use defaults
const DATABASE_ID = process.env.INDEX_ADVISOR_TEST_DATABASE || "t_db05_1765364190570";
const CONTAINER_ID = process.env.INDEX_ADVISOR_TEST_CONTAINER || "testcontainer";

test("Index Advisor tab loads without errors", async ({ page }) => {
  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  // Wait for and expand the database node
  const databaseNode = await explorer.waitForNode(DATABASE_ID);
  await databaseNode.expand();

  // Wait for and expand the container node
  const containerNode = await explorer.waitForNode(`${DATABASE_ID}/${CONTAINER_ID}`);
  await containerNode.expand();

  // Click on "New SQL Query" from the container's context menu
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();

  // Wait for the query tab to fully load
  await page.waitForTimeout(3000);

  // Wait for the query tab to load
  const queryTab = explorer.queryTab("tab0");
  await queryTab.editor().locator.waitFor({ timeout: 30 * 1000 });
  await queryTab.executeCTA.waitFor();

  // Click on the specific query tab (tab0) to make sure it's active
  const queryTabHeader = explorer.frame.getByRole("tab", { name: "Query 1" });
  await queryTabHeader.click();
  await page.waitForTimeout(1000);

  // Click in the editor and execute the query
  await queryTab.editor().locator.click();
  const executeQueryButton = explorer.commandBarButton("Execute Query");
  await executeQueryButton.waitFor({ state: "visible", timeout: 10000 });
  await executeQueryButton.click();

  // Wait for results to load
  await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

  // Click on the Index Advisor tab
  const indexAdvisorTab = queryTab.resultsView.getByTestId("QueryTab/ResultsPane/ResultsView/IndexAdvisorTab");
  await indexAdvisorTab.click();

  // Verify the Index Advisor tab is visible and loaded
  await expect(indexAdvisorTab).toHaveAttribute("aria-selected", "true");
});
