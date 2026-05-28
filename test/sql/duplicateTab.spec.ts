import { expect, test } from "@playwright/test";

import { DataExplorer, TestAccount } from "../fx";
import { createTestSQLContainer, TestContainerContext } from "../testData";

let context: TestContainerContext = null!;
let explorer: DataExplorer = null!;

test.beforeAll("Create Test Database", async () => {
  context = await createTestSQLContainer({ includeTestData: false });
});

test.afterAll("Delete Test Database", async () => {
  await context?.dispose();
});

test.beforeEach("Open Data Explorer", async ({ page }) => {
  explorer = await DataExplorer.open(page, TestAccount.SQL);
});

test("Duplicate Items tab opens a second Items tab", async () => {
  // Open Items tab
  const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
  await containerNode.expand();
  const itemsNode = await explorer.waitForContainerItemsNode(context.database.id, context.container.id);
  await itemsNode.element.click();

  const documentsTab = explorer.documentsTab("tab0");
  await documentsTab.documentsFilter.waitFor({ timeout: 30_000 });

  // Right-click the tab nav header
  await explorer.tabNavHeader("tab0").click({ button: "right" });

  // "Duplicate tab" should be visible in the context menu
  const duplicateMenuItem = explorer.tabContextMenuItem("Duplicate tab");
  await expect(duplicateMenuItem).toBeVisible();
  await duplicateMenuItem.click();

  // A second tab should appear
  const tab1 = explorer.tab("tab1");
  await expect(tab1).toBeAttached({ timeout: 30_000 });

  // The duplicated tab should also show the Documents content
  const duplicatedTab = explorer.documentsTab("tab1");
  await duplicatedTab.documentsFilter.waitFor({ timeout: 30_000 });
});

test("Duplicate Query tab preserves query text in new tab", async () => {
  // Open a new SQL query tab via container context menu
  const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem("New SQL Query").click();

  const queryTab = explorer.queryTab("tab0");
  const editor = queryTab.editor();
  await editor.locator.waitFor({ timeout: 30_000 });

  // Type a custom query
  const customQuery = 'SELECT * FROM c WHERE c.id = "duplicate-query-test"';
  await editor.setText(customQuery);

  // Right-click the tab nav header
  await explorer.tabNavHeader("tab0").click({ button: "right" });

  const duplicateMenuItem = explorer.tabContextMenuItem("Duplicate tab");
  await expect(duplicateMenuItem).toBeVisible();
  await duplicateMenuItem.click();

  // Second query tab should appear
  const tab1 = explorer.tab("tab1");
  await expect(tab1).toBeAttached({ timeout: 30_000 });

  // The duplicated tab should contain the same query text
  const duplicatedQueryTab = explorer.queryTab("tab1");
  await duplicatedQueryTab.editor().locator.waitFor({ timeout: 30_000 });
  const editorText = await duplicatedQueryTab.editor().text();
  expect(editorText).toContain("duplicate-query-test");
});

test("Right-click context menu does not appear for the Home tab", async () => {
  // The Home tab (ReactTabKind) is never duplicable — no context menu should appear
  await explorer.tabNavHeader("Home").click({ button: "right" });

  // Neither menu item should be visible
  await expect(explorer.tabContextMenuItem("Duplicate tab")).not.toBeVisible();
  await expect(explorer.tabContextMenuItem("Close tab")).not.toBeVisible();
});

test("Close tab from right-click menu closes the tab", async () => {
  // Open Items tab
  const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
  await containerNode.expand();
  const itemsNode = await explorer.waitForContainerItemsNode(context.database.id, context.container.id);
  await itemsNode.element.click();

  const documentsTab = explorer.documentsTab("tab0");
  await documentsTab.documentsFilter.waitFor({ timeout: 30_000 });

  // Right-click the tab nav header and close the tab
  await explorer.tabNavHeader("tab0").click({ button: "right" });
  await explorer.tabContextMenuItem("Close tab").click();

  // The tab pane should be removed
  await expect(explorer.tab("tab0")).not.toBeAttached({ timeout: 15_000 });
});
