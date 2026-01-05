import { expect, test } from "@playwright/test";

import { CommandBarButton, DataExplorer, Editor, QueryTab, TestAccount } from "../fx";
import { TestContainerContext, TestItem, createTestSQLContainer } from "../testData";

let context: TestContainerContext = null!;
let explorer: DataExplorer = null!;
let queryTab: QueryTab = null!;
let queryEditor: Editor = null!;

test.beforeAll("Create Test Database", async () => {
  context = await createTestSQLContainer({ includeTestData: true });
});

test.beforeEach("Open new query tab", async ({ page }) => {
  // Open a query tab
  explorer = await DataExplorer.open(page, TestAccount.SQL);

  // Container nodes should be visible. The explorer auto-expands database nodes when they are first loaded.
  const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();

  // Wait for the editor to load
  queryTab = explorer.queryTab("tab0");
  queryEditor = queryTab.editor();
  await queryEditor.locator.waitFor({ timeout: 30 * 1000 });
  await queryTab.executeCTA.waitFor();
  await explorer.frame.getByTestId("NotificationConsole/ExpandCollapseButton").click();
  await explorer.frame.getByTestId("NotificationConsole/Contents").waitFor();
});

if (!process.env.CI) {
  test.afterAll("Delete Test Database", async () => {
  await context?.dispose();
});
}

test("Query results", async () => {
  // Run the query and verify the results
  await queryEditor.locator.click();
  const executeQueryButton = explorer.commandBarButton(CommandBarButton.ExecuteQuery);
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

  // Read the results
  const resultText = await queryTab.resultsEditor.text();
  expect(resultText).not.toBeNull();
  const resultData: TestItem[] = JSON.parse(resultText!);

  // Pick 3 random documents and assert them
  const randomDocs = [0, 1, 2].map(() => resultData[Math.floor(Math.random() * resultData.length)]);
  randomDocs.forEach((doc) => {
    const matchingDoc = context?.testData.get(doc.id);
    expect(matchingDoc).not.toBeNull();
    expect(doc.randomData).toEqual(matchingDoc?.randomData);
    expect(doc.partitionKey).toEqual(matchingDoc?.partitionKey);
  });
});

test("Query stats", async () => {
  // Run the query and verify the results
  await queryEditor.locator.click();
  const executeQueryButton = explorer.commandBarButton(CommandBarButton.ExecuteQuery);
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

  // Open the query stats tab and validate some data there
  queryTab.queryStatsTab.click();
  await expect(queryTab.queryStatsList).toBeAttached();
  const showingResultsCell = queryTab.queryStatsList.getByTestId("Row:Showing Results/Column:value");
  await expect(showingResultsCell).toContainText(/\d+ - \d+/);
});

test("Query errors", async () => {
  test.skip(true, "Disabled due to an issue with error reporting in the backend.");

  await queryEditor.locator.click();
  await queryEditor.setText("SELECT\n  glarb(c.id),\n  blarg(c.id)\nFROM c");

  // Run the query and verify the results
  const executeQueryButton = explorer.commandBarButton(CommandBarButton.ExecuteQuery);
  await executeQueryButton.click();

  await expect(queryTab.errorList).toBeAttached({ timeout: 60 * 1000 });

  // Validating the squiggles requires a lot of digging through the Monaco model, OR a screenshot comparison.
  // The screenshot ended up being fairly flaky, and a pain to maintain, so I decided not to include validation for the squiggles.

  // Validate the errors are in the list
  await expect(queryTab.errorList.getByTestId("Row:0/Column:code")).toHaveText("SC2005");
  await expect(queryTab.errorList.getByTestId("Row:0/Column:location")).toHaveText("Line 2");
  await expect(queryTab.errorList.getByTestId("Row:1/Column:code")).toHaveText("SC2005");
  await expect(queryTab.errorList.getByTestId("Row:1/Column:location")).toHaveText("Line 3");
});
