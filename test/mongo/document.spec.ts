import { expect, test } from "@playwright/test";

import { setupCORSBypass } from "../CORSBypass";
import { CommandBarButton, DataExplorer, DocumentsTab, TestAccount } from "../fx";
import { retry, serializeMongoToJson, setPartitionKeys } from "../testData";
import { documentTestCases } from "./testCases";

let explorer: DataExplorer = null!;
let documentsTab: DocumentsTab = null!;

for (const { name, databaseId, containerId, documents } of documentTestCases) {
  test.describe(`Test MongoRU Documents with ${name}`, () => {
    // test.skip(true, "Temporarily disabling all tests in this spec file");
    test.beforeEach("Open documents tab", async ({ page }) => {
      await setupCORSBypass(page);
      explorer = await DataExplorer.open(page, TestAccount.MongoReadonly);

      const containerNode = await explorer.waitForContainerNode(databaseId, containerId);
      await containerNode.expand();

      const containerMenuNode = await explorer.waitForContainerDocumentsNode(databaseId, containerId);
      await containerMenuNode.element.click();

      documentsTab = explorer.documentsTab("tab0");

      await documentsTab.documentsFilter.waitFor();
      await documentsTab.documentsListPane.waitFor();
      await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

      await explorer.expandNotificationConsole();
    });
    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: "ignoreErrors" });
    });

    for (const document of documents) {
      const { documentId: docId, partitionKeys } = document;
      test.describe(`Document ID: ${docId}`, () => {
        test(`should load and view document ${docId}`, async () => {
          const span = documentsTab.documentsListPane.getByText(docId, { exact: true }).nth(0);
          await span.waitFor();
          await expect(span).toBeVisible();

          await span.click();
          await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

          const resultText = await documentsTab.resultsEditor.text();
          const resultData = serializeMongoToJson(resultText!);
          expect(resultText).not.toBeNull();
          expect(resultData?._id).not.toBeNull();
          expect(resultData?._id).toEqual(docId);
        });
        test(`should be able to create and delete new document from ${docId}`, async ({ page }) => {
          const span = documentsTab.documentsListPane.getByText(docId, { exact: true }).nth(0);
          await span.waitFor();
          await expect(span).toBeVisible();

          await span.click();
          let newDocumentId;
          await retry(async () => {
            const newDocumentButton = await explorer.waitForCommandBarButton(CommandBarButton.NewDocument, 5000);
            await expect(newDocumentButton).toBeVisible();
            await expect(newDocumentButton).toBeEnabled();
            await newDocumentButton.click();

            await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

            newDocumentId = `${Date.now().toString()}-delete`;

            const newDocument = {
              _id: newDocumentId,
              ...setPartitionKeys(partitionKeys || []),
            };

            await documentsTab.resultsEditor.setText(JSON.stringify(newDocument));
            await page.waitForTimeout(5000); // wait for editor to process changes
            const saveButton = await explorer.waitForCommandBarButton(CommandBarButton.Save, 5000);
            await saveButton.click({ timeout: 5000 });
            await expect(saveButton).toBeHidden({ timeout: 5000 });
          }, 3);

          await documentsTab.setFilter(`{_id: "${newDocumentId}"}`);
          await documentsTab.filterButton.click();

          const newSpan = documentsTab.documentsListPane.getByText(newDocumentId, { exact: true }).nth(0);
          await newSpan.waitFor();
          await newSpan.click();
          await expect(documentsTab.resultsEditor.locator).toBeAttached({ timeout: 60 * 1000 });

          const deleteButton = await explorer.waitForCommandBarButton(CommandBarButton.Delete, 5000);
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
