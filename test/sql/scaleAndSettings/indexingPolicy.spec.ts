import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Indexing Policy under Scale & Settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database & Open Indexing Policy tab", async ({ browser }) => {
    context = await createTestSQLContainer();
    const page = await browser.newPage();
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings and open Indexing Policy tab
    await explorer.openScaleAndSettings(context);
    const indexingPolicyTab = explorer.frame.getByTestId("settings-tab-header/IndexingPolicyTab");
    await indexingPolicyTab.click();
  });

  test.afterAll("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Verify Indexing Policy tab is visible", async () => {
    const indexingPolicyTab = explorer.frame.getByTestId("settings-tab-header/IndexingPolicyTab");
    await expect(indexingPolicyTab).toBeVisible();
  });

  test("Verify Indexing Policy editor is present", async () => {
    // The Monaco editor is rendered in a div with class settingsV2Editor
    const indexingPolicyEditor = explorer.frame.locator(".settingsV2Editor");
    await expect(indexingPolicyEditor).toBeVisible();

    // Verify the editor has content (default indexing policy)
    const editorContent = await indexingPolicyEditor.textContent();
    expect(editorContent).toBeTruthy();
  });

  test("Update Indexing Policy - Change automatic to false", async () => {
    // Get the Monaco editor element
    const editorElement = explorer.frame.locator(".settingsV2Editor").locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Get current indexing policy content
    const currentContent = await editorElement.evaluate((element) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_getEditorContentForElement) {
        return win._monaco_getEditorContentForElement(element);
      }
      return null;
    });

    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Verify default policy structure
    expect(indexingPolicy).toHaveProperty("automatic");
    expect(indexingPolicy).toHaveProperty("indexingMode");

    // Modify the indexing policy - change automatic to false
    indexingPolicy.automatic = false;
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editorElement.evaluate((element, content) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_setEditorContentForElement) {
        win._monaco_setEditorContentForElement(element, content);
      }
    }, updatedContent);

    // Verify the warning message appears for unsaved changes
    const warningMessage = explorer.frame.locator(".ms-MessageBar--warning");
    await expect(warningMessage).toBeVisible({ timeout: 5000 });

    // Save the changes
    await explorer.commandBarButton(CommandBarButton.Save).click();

    // Verify success message
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Verify warning message is no longer visible after save
    await expect(warningMessage).not.toBeVisible({ timeout: 5000 });
  });

  test("Update Indexing Policy - Change indexingMode to lazy", async () => {
    // Get the Monaco editor element
    const editorElement = explorer.frame.locator(".settingsV2Editor").locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Get current indexing policy content
    const currentContent = await editorElement.evaluate((element) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_getEditorContentForElement) {
        return win._monaco_getEditorContentForElement(element);
      }
      return null;
    });

    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Modify the indexing policy - change indexingMode to lazy
    indexingPolicy.indexingMode = "lazy";
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editorElement.evaluate((element, content) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_setEditorContentForElement) {
        win._monaco_setEditorContentForElement(element, content);
      }
    }, updatedContent);

    // Verify the warning message appears
    const warningMessage = explorer.frame.locator(".ms-MessageBar--warning");
    await expect(warningMessage).toBeVisible({ timeout: 5000 });

    // Save the changes
    await explorer.commandBarButton(CommandBarButton.Save).click();

    // Verify success message
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Update Indexing Policy - Revert automatic to true", async () => {
    // Get the Monaco editor element
    const editorElement = explorer.frame.locator(".settingsV2Editor").locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Get current indexing policy content
    const currentContent = await editorElement.evaluate((element) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_getEditorContentForElement) {
        return win._monaco_getEditorContentForElement(element);
      }
      return null;
    });

    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Revert the changes - set automatic back to true and indexingMode to consistent
    indexingPolicy.automatic = true;
    indexingPolicy.indexingMode = "consistent";
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editorElement.evaluate((element, content) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = element.ownerDocument.defaultView as any;
      if (win._monaco_setEditorContentForElement) {
        win._monaco_setEditorContentForElement(element, content);
      }
    }, updatedContent);

    // Save the changes
    await explorer.commandBarButton(CommandBarButton.Save).click();

    // Verify success message
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });
});
