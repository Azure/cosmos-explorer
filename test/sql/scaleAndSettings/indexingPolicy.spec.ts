import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, Editor, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Indexing Policy under Scale & Settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  // Helper function to get the indexing policy editor
  const getIndexingPolicyEditor = (): Editor => {
    const editorContainer = explorer.frame.locator(".settingsV2Editor");
    return new Editor(explorer.frame, editorContainer);
  };

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
    const editorContainer = explorer.frame.locator(".settingsV2Editor");
    await expect(editorContainer).toBeVisible();

    // Verify the editor has content (default indexing policy) using Editor helper
    const editor = getIndexingPolicyEditor();
    const editorContent = await editor.text();
    expect(editorContent).toBeTruthy();
  });

  test("Update Indexing Policy - Change automatic to false", async () => {
    // Get the Monaco editor element - IndexingPolicyComponent creates Monaco directly
    const editorContainer = explorer.frame.locator(".settingsV2Editor");
    const editorElement = editorContainer.locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Use helper function to get editor instance
    const editor = getIndexingPolicyEditor();

    // Get current indexing policy content
    const currentContent = await editor.text();
    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Verify default policy structure
    expect(indexingPolicy).toHaveProperty("automatic");
    expect(indexingPolicy).toHaveProperty("indexingMode");

    // Modify the indexing policy - change automatic to false
    indexingPolicy.automatic = false;
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editor.setText(updatedContent);

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
    const editorContainer = explorer.frame.locator(".settingsV2Editor");
    const editorElement = editorContainer.locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Use helper function to get editor instance
    const editor = getIndexingPolicyEditor();

    // Get current indexing policy content
    const currentContent = await editor.text();
    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Modify the indexing policy - change indexingMode to lazy
    indexingPolicy.indexingMode = "lazy";
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editor.setText(updatedContent);

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
    const editorContainer = explorer.frame.locator(".settingsV2Editor");
    const editorElement = editorContainer.locator(".monaco-editor");
    await expect(editorElement).toBeVisible();

    // Use helper function to get editor instance
    const editor = getIndexingPolicyEditor();

    // Get current indexing policy content
    const currentContent = await editor.text();
    expect(currentContent).toBeTruthy();
    const indexingPolicy = JSON.parse(currentContent as string);

    // Revert the changes - set automatic back to true and indexingMode to consistent
    indexingPolicy.automatic = true;
    indexingPolicy.indexingMode = "consistent";
    const updatedContent = JSON.stringify(indexingPolicy, null, 4);

    // Set the new content in the editor
    await editor.setText(updatedContent);

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
