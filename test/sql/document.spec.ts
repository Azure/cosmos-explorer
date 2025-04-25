import { expect, test } from "@playwright/test";

import { DataExplorer, DocumentsTab, TestAccount } from "../fx";
import { retry, setPartitionKeys } from "../testData";
import { documentTestCases } from "./testCases";

let explorer: DataExplorer = null!;
let documentsTab: DocumentsTab = null!;

for (const { name, databaseId, containerId, documents } of documentTestCases) {
  test.describe(`Test SQL Documents with ${name}`, () => {
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

    for (const document of documents) {
      const { documentId: docId, partitionKeys, skipCreateDelete } = document;
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

        const testOrSkip = skipCreateDelete ? test.skip : test;
        testOrSkip(`should be able to create and delete new document from ${docId}`, async ({ page }) => {
          const span = documentsTab.documentsListPane.getByText(docId, { exact: true }).nth(0);
          await span.waitFor();
          await expect(span).toBeVisible();

          await span.click();
          let newDocumentId;
          await page.waitForTimeout(5000);
          await retry(async () => {
            const newDocumentButton = await explorer.waitForCommandBarButton("New Item", 5000);
            await expect(newDocumentButton).toBeVisible();
            await expect(newDocumentButton).toBeEnabled();
            await newDocumentButton.click();

            await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

            newDocumentId = `${Date.now().toString()}-delete`;

            const newDocument = {
              id: newDocumentId,
              ...setPartitionKeys(partitionKeys || []),
            };

            await documentsTab.resultsEditor.setText(JSON.stringify(newDocument));
            const saveButton = await explorer.waitForCommandBarButton("Save", 5000);
            await saveButton.click({ timeout: 5000 });
            await expect(saveButton).toBeHidden({ timeout: 5000 });
          }, 3);

          await documentsTab.setFilter(`WHERE c.id = "${newDocumentId}"`);
          await documentsTab.filterButton.click();

          const newSpan = documentsTab.documentsListPane.getByText(newDocumentId, { exact: true }).nth(0);
          await newSpan.waitFor();

          await newSpan.click();
          await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

          const deleteButton = await explorer.waitForCommandBarButton("Delete", 5000);
          await deleteButton.click();

          const deleteDialogButton = await explorer.waitForDialogButton("Delete", 5000);
          await deleteDialogButton.click();

          const deletedSpan = documentsTab.documentsListPane.getByText(newDocumentId, { exact: true }).nth(0);
          await expect(deletedSpan).toHaveCount(0);
        });
      });
    }
  });
}
