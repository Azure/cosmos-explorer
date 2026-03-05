import { expect, test } from "@playwright/test";

import { existsSync, mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { CommandBarButton, DataExplorer, DocumentsTab, ONE_MINUTE_MS, TestAccount } from "../fx";
import {
  createTestSQLContainer,
  itemsPerPartition,
  partitionCount,
  retry,
  setPartitionKeys,
  TestContainerContext,
  TestData,
} from "../testData";
import { documentTestCases } from "./testCases";

let explorer: DataExplorer = null!;
let documentsTab: DocumentsTab = null!;

for (const { name, databaseId, containerId, documents } of documentTestCases) {
  test.describe(`Test SQL Documents with ${name}`, () => {
    // test.skip(true, "Temporarily disabling all tests in this spec file");
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

test.describe.serial("Upload Item", () => {
  let context: TestContainerContext = null!;
  let uploadDocumentDirPath: string = null!;
  let uploadDocumentFilePath: string = null!;

  test.beforeAll("Create Test database and open documents tab", async ({ browser }) => {
    uploadDocumentDirPath = mkdtempSync(path.join(tmpdir(), "upload-document-"));
    uploadDocumentFilePath = path.join(uploadDocumentDirPath, "uploadDocument.json");

    const page = await browser.newPage();
    context = await createTestSQLContainer();
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.expand();

    const containerMenuNode = await explorer.waitForContainerItemsNode(context.database.id, context.container.id);
    await containerMenuNode.element.click();
    // We need to click twice in order to remove a tooltip
    await containerMenuNode.element.click();
  });

  test.afterAll("Delete Test Database and uploadDocument temp folder", async () => {
    if (existsSync(uploadDocumentFilePath)) {
      unlinkSync(uploadDocumentFilePath);
    }
    if (existsSync(uploadDocumentDirPath)) {
      rmdirSync(uploadDocumentDirPath);
    }
    await context?.dispose();
  });

  test.afterEach("Close Upload Items panel if still open", async () => {
    const closeUploadItemsPanelButton = explorer.frame.getByLabel("Close Upload Items");
    if (await closeUploadItemsPanelButton.isVisible()) {
      await closeUploadItemsPanelButton.click();
    }
  });

  test("upload document", async () => {
    // Create file to upload
    const TestDataJsonString: string = JSON.stringify(TestData, null, 2);
    writeFileSync(uploadDocumentFilePath, TestDataJsonString);

    const uploadItemCommandBar = explorer.commandBarButton(CommandBarButton.UploadItem);
    await uploadItemCommandBar.click();

    // Select file to upload
    await explorer.frame.setInputFiles("#importFileInput", uploadDocumentFilePath);

    const uploadButton = explorer.frame.getByTestId("Panel/OkButton");
    await uploadButton.click();

    // Verify upload success message
    const fileUploadStatusExpected: string = `${partitionCount * itemsPerPartition} created, 0 throttled, 0 errors`;
    const fileUploadStatus = explorer.frame.getByTestId("file-upload-status");
    await expect(fileUploadStatus).toContainText(fileUploadStatusExpected, {
      timeout: ONE_MINUTE_MS,
    });

    // Select file to upload again
    await explorer.frame.setInputFiles("#importFileInput", uploadDocumentFilePath);
    await uploadButton.click();

    // Verify upload failure message
    const errorIcon = explorer.frame.getByRole("img", { name: "error" });
    await expect(errorIcon).toBeVisible({ timeout: ONE_MINUTE_MS });
    await expect(fileUploadStatus).toContainText(
      `0 created, 0 throttled, ${partitionCount * itemsPerPartition} errors`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });

  test("upload invalid json", async () => {
    // Create file to upload
    let TestDataJsonString: string = JSON.stringify(TestData, null, 2);
    // Remove the first '[' so that it becomes invalid json
    TestDataJsonString = TestDataJsonString.substring(1);
    writeFileSync(uploadDocumentFilePath, TestDataJsonString);

    const uploadItemCommandBar = explorer.commandBarButton(CommandBarButton.UploadItem);
    await uploadItemCommandBar.click();

    // Select file to upload
    await explorer.frame.setInputFiles("#importFileInput", uploadDocumentFilePath);

    const uploadButton = explorer.frame.getByTestId("Panel/OkButton");
    await uploadButton.click();

    // Verify upload failure message
    const fileUploadErrorList = explorer.frame.getByLabel("error list");
    // The parsing error will show up differently in different browsers so just check for the word "JSON"
    await expect(fileUploadErrorList).toContainText("JSON", {
      timeout: ONE_MINUTE_MS,
    });
  });
});
