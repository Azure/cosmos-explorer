import { expect, test } from "@playwright/test";

import { DataExplorer, DocumentsTab, TestAccount } from "../fx";
import { documentTestCases } from "./testCases";

let explorer: DataExplorer = null!;
let documentsTab: DocumentsTab = null!;

for (const { name, databaseId, containerId, expectedDocumentIds } of documentTestCases) {
  test.describe(`Test Documents with ${name}`, () => {
    test.beforeEach("Open documents tab", async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQLReadOnly);

      const containerNode = await explorer.waitForContainerNode(databaseId, containerId);
      await containerNode.expand();

      const containerMenuNode = await explorer.waitForContainerItemsNode(databaseId, containerId);
      await containerMenuNode.element.click();

      documentsTab = explorer.documentsTab("tab0");

      await documentsTab.documentsFilter.waitFor();
      await documentsTab.documentsListPane.waitFor();
      await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });
    });

    for (const docId of expectedDocumentIds) {
      test.describe(`Document ID: ${docId}`, () => {
        test(`should load and view document ${docId}`, async () => {
          const span = documentsTab.documentsListPane.getByText(docId, { exact: true }).nth(0);
          await span.waitFor();
          await expect(span).toBeVisible();

          await span.click();
          await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

          const resultText = await documentsTab.resultsEditor.text();
          const resultData = JSON.parse(resultText!);
          expect(resultText).not.toBeNull();
          expect(resultData?.id).toEqual(docId);
        });
      });
    }
  });
}
