import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("User Defined Functions", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;
  const udfBody: string = `function extractDocumentId(doc) {
    return {
      id: doc.id
    };
  }`;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer({
      testAccount: TestAccount.SQL2,
    });
  });

  test.beforeEach("Open container", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL2);
  });

  // Delete database only if not running in CI
  if (!process.env.CI) {
    test.afterEach("Delete Test Database", async () => {
      await context?.dispose();
    });
  }

  test("Add, execute, and delete user defined function", async ({ page }, testInfo) => {
    // Open container context menu and click New UDF
    const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.openContextMenu();
    await containerNode.contextMenuItem("New UDF").click();

    // Assign UDF id
    const udfIdTextBox = explorer.frame.getByLabel("User Defined Function Id");
    const udfId: string = `extractDocumentId-${testInfo.testId}`;
    await udfIdTextBox.fill(udfId);

    // Create UDF body that extracts the document id from a document
    const udfBodyTextArea = explorer.frame.getByTestId("EditorReact/Host/Loaded");
    await udfBodyTextArea.click();

    // Clear existing content
    const isMac: boolean = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+A" : "Control+A");
    await page.keyboard.press("Backspace");

    await page.keyboard.type(udfBody);

    // Save changes
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully created user defined function ${udfId}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Delete UDF
    await containerNode.expand();
    const udfsNode = await explorer.waitForNode(
      `${context.database.id}/${context.container.id}/User Defined Functions`,
    );
    await udfsNode.expand();
    const udfNode = await explorer.waitForNode(
      `${context.database.id}/${context.container.id}/User Defined Functions/${udfId}`,
    );
    await udfNode.openContextMenu();
    await udfNode.contextMenuItem("Delete User Defined Function").click();
    const deleteUserDefinedFunctionButton = explorer.frame.getByTestId("DialogButton:Delete");
    await deleteUserDefinedFunctionButton.click();

    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully deleted user defined function ${udfId}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });
});
