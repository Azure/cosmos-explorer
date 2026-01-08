import { expect, test } from "@playwright/test";
import { setupCORSBypass } from "../CORSBypass";
import { DataExplorer, QueryTab, TestAccount, CommandBarButton, Editor } from "../fx";
import { serializeMongoToJson } from "../testData";

const databaseId = "test-e2etests-mongo-pagination";
const collectionId = "test-coll-mongo-pagination";
let explorer: DataExplorer = null!;

test.setTimeout(5 * 60 * 1000);

test.describe("Test Mongo Pagination", () => {
  let queryTab: QueryTab;
  let queryEditor: Editor;

  test.beforeEach("Open query tab", async ({ page }) => {
    await setupCORSBypass(page);
    explorer = await DataExplorer.open(page, TestAccount.MongoReadonly);

    const containerNode = await explorer.waitForContainerNode(databaseId, collectionId);
    await containerNode.expand();

    const containerMenuNode = await explorer.waitForContainerDocumentsNode(databaseId, collectionId);
    await containerMenuNode.openContextMenu();
    await containerMenuNode.contextMenuItem("New Query").click();

    queryTab = explorer.queryTab("tab0");
    queryEditor = queryTab.editor();
    await queryEditor.locator.waitFor({ timeout: 30 * 1000 });
    await queryTab.executeCTA.waitFor();
    await explorer.frame.getByTestId("NotificationConsole/ExpandCollapseButton").click();
    await explorer.frame.getByTestId("NotificationConsole/Contents").waitFor();
  });

  test("should execute a query and load more results", async ({ page }) => {
    const query = "{}";

    await queryEditor.locator.click();
    await queryEditor.setText(query);

    const executeQueryButton = explorer.commandBarButton(CommandBarButton.ExecuteQuery);
    await executeQueryButton.click();

    // Wait for query execution to complete
    await expect(queryTab.resultsView).toBeVisible({ timeout: 60000 });
    await expect(queryTab.resultsEditor.locator).toBeAttached({ timeout: 30000 });

    // Get initial results
    const resultText = await queryTab.resultsEditor.text();

    if (!resultText || resultText.trim() === "" || resultText.trim() === "[]") {
      throw new Error("Query returned no results - the collection appears to be empty");
    }

    const resultData = serializeMongoToJson(resultText);

    if (resultData.length === 0) {
      throw new Error("Parsed results contain 0 documents - collection is empty");
    }

    if (resultData.length < 100) {
      expect(resultData.length).toBeGreaterThan(0);
      return;
    }

    expect(resultData.length).toBe(100);

    // Pagination test
    let totalPagesLoaded = 1;
    const maxLoadMoreAttempts = 10;

    for (let loadMoreAttempts = 0; loadMoreAttempts < maxLoadMoreAttempts; loadMoreAttempts++) {
      const loadMoreButton = queryTab.resultsView.getByText("Load more");

      try {
        await expect(loadMoreButton).toBeVisible({ timeout: 5000 });
      } catch {
        // Load more button not visible - pagination complete
        break;
      }

      const beforeClickText = await queryTab.resultsEditor.text();
      const beforeClickHash = Buffer.from(beforeClickText || "")
        .toString("base64")
        .substring(0, 50);

      await loadMoreButton.click();

      // Wait for content to update
      let editorContentChanged = false;
      for (let waitAttempt = 1; waitAttempt <= 3; waitAttempt++) {
        await page.waitForTimeout(2000);

        const currentEditorText = await queryTab.resultsEditor.text();
        const currentHash = Buffer.from(currentEditorText || "")
          .toString("base64")
          .substring(0, 50);

        if (currentHash !== beforeClickHash) {
          editorContentChanged = true;
          break;
        }
      }

      if (editorContentChanged) {
        totalPagesLoaded++;
      } else {
        // No content change detected, stop pagination
        break;
      }

      await page.waitForTimeout(1000);
    }

    // Final verification
    const finalIndicator = queryTab.resultsView.locator("text=/\\d+ - \\d+/");
    const finalIndicatorText = await finalIndicator.textContent();

    if (finalIndicatorText) {
      const match = finalIndicatorText.match(/(\d+) - (\d+)/);
      if (match) {
        const totalDocuments = parseInt(match[2]);
        expect(totalDocuments).toBe(405);
        expect(totalPagesLoaded).toBe(5);
      } else {
        throw new Error(`Invalid results indicator format: ${finalIndicatorText}`);
      }
    } else {
      expect(totalPagesLoaded).toBe(5);
    }
  });
});
