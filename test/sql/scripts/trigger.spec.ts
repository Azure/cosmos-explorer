import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Triggers", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;
  const triggerBody = `function validateToDoItemTimestamp() {
        var context = getContext();
        var request = context.getRequest();

        var itemToCreate = request.getBody();

        if (!("timestamp" in itemToCreate)) {
            var ts = new Date();
            itemToCreate["timestamp"] = ts.getTime();
        }

        request.setBody(itemToCreate);
    }`;
  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer({
      testAccount: TestAccount.SQL2,
    });
  });

  test.beforeEach("Open container", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL2);
  });

  test.afterEach("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Add and delete trigger", async ({ page }, testInfo) => {
    // Open container context menu and click New Trigger
    const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.openContextMenu();
    await containerNode.contextMenuItem("New Trigger").click();

    // Assign Trigger id
    const triggerIdTextBox = explorer.frame.getByLabel("Trigger Id");
    const triggerId: string = `validateItemTimestamp-${testInfo.testId}`;
    await triggerIdTextBox.fill(triggerId);

    // Create Trigger body that validates item timestamp
    const triggerBodyTextArea = explorer.frame.getByTestId("EditorReact/Host/Loaded");
    await triggerBodyTextArea.click();

    // Clear existing content
    const isMac: boolean = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+A" : "Control+A");
    await page.keyboard.press("Backspace");

    await page.keyboard.type(triggerBody);

    // Save changes
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(`Successfully created trigger ${triggerId}`, {
      timeout: 2 * ONE_MINUTE_MS,
    });

    // Delete Trigger
    await containerNode.expand();
    const triggersNode = await explorer.waitForNode(`${context.database.id}/${context.container.id}/Triggers`);
    await triggersNode.expand();
    const triggerNode = await explorer.waitForNode(
      `${context.database.id}/${context.container.id}/Triggers/${triggerId}`,
    );

    await triggerNode.openContextMenu();
    await triggerNode.contextMenuItem("Delete Trigger").click();
    const deleteTriggerButton = explorer.frame.getByTestId("DialogButton:Delete");
    await deleteTriggerButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(`Successfully deleted trigger ${triggerId}`, {
      timeout: ONE_MINUTE_MS,
    });
  });
});
