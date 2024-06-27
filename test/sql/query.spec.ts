import { expect, test } from "@playwright/test";

import {
  DataExplorer,
  Editor,
  QueryTab,
  TestAccount
} from "../fx";
import { TestContainerContext, TestItem, createTestSQLContainer } from "../testData";

let context: TestContainerContext = null!;
let explorer: DataExplorer = null!;
let queryTab: QueryTab = null!;
let queryEditor: Editor = null!;

test.beforeAll("Create Test Database", async () => {
  context = await createTestSQLContainer(true);
});

test.beforeEach("Open new query tab", async ({ page }) => {
  // Open a query tab
  explorer = await DataExplorer.open(page, TestAccount.SQL);
  const databaseNode = explorer.treeNode(`DATA/${context.database.id}`);
  await databaseNode.expand();
  const containerNode = explorer.treeNode(`DATA/${context.database.id}/${context.container.id}`);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();

  // Wait for the editor to load
  queryTab = explorer.queryTab("tab0");
  queryEditor = queryTab.editor();
  await expect(queryEditor.locator).toBeAttached();
  await expect(queryTab.executeCTA).toBeAttached();
});

test.afterAll("Delete Test Database", async () => {
  await context?.dispose();
});

test("Query results", async () => {
  // Run the query and verify the results
  const executeQueryButton = explorer.commandBarButton("Execute Query");
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached();

  // Read the results
  const resultText = await queryTab.resultsEditor.text();
  expect(resultText).not.toBeNull();
  const resultData: TestItem[] = JSON.parse(resultText!);

  // Pick 3 random documents and assert them
  const randomDocs = [0, 1, 2].map(() => resultData[Math.floor(Math.random() * resultData.length)]);
  randomDocs.forEach(doc => {
    const matchingDoc = context?.testData.get(doc.id);
    expect(matchingDoc).not.toBeNull();
    expect(doc.randomData).toEqual(matchingDoc?.randomData);
    expect(doc.partitionKey).toEqual(matchingDoc?.partitionKey);
  });
});

test("Query stats", async () => {
  // Run the query and verify the results
  const executeQueryButton = explorer.commandBarButton("Execute Query");
  await executeQueryButton.click();
  await expect(queryTab.resultsEditor.locator).toBeAttached();

  // Open the query stats tab and validate some data there
  queryTab.queryStatsTab.click();
  await expect(queryTab.queryStatsList).toBeAttached();
  const showingResultsCell = queryTab.queryStatsList.getByTestId("Row:Showing Results/Column:value");
  await expect(showingResultsCell).toContainText(/\d+ - \d+/);
});

test("Query errors", async () => {
  await queryEditor.setText("SELECT\n  glarb(c.id),\n  blarg(c.id)\nFROM c");

  // Run the query and verify the results
  const executeQueryButton = explorer.commandBarButton("Execute Query");
  await executeQueryButton.click();

  await expect(queryTab.errorList).toBeAttached();

  // Validate the squiggles using a screenshot.
  // NOTE: If this gets flaky, we can skip this validation, or we can inject a hook into the page to extract the raw marker data and validate that.
  await expect(queryEditor.locator).toHaveScreenshot();

  // Validate the errors are in the list
  await expect(queryTab.errorList.getByTestId("Row:0/Column:code")).toHaveText("SC2005");
  await expect(queryTab.errorList.getByTestId("Row:0/Column:location")).toHaveText("Line 2");
  await expect(queryTab.errorList.getByTestId("Row:1/Column:code")).toHaveText("SC2005");
  await expect(queryTab.errorList.getByTestId("Row:1/Column:location")).toHaveText("Line 3");
});