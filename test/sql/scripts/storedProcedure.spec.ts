import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Stored Procedures", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer({
      testAccount: TestAccount.SQL2,
    });
  });

  test.beforeEach("Open container", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);
  });

  test.afterAll("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Add, execute, and delete stored procedure", async ({ page }, testInfo) => {
    void page;
    // Open container context menu and click New Stored Procedure
    const containerNode = await explorer.waitForContainerNode(context.database.id, context.container.id);
    await containerNode.openContextMenu();
    await containerNode.contextMenuItem("New Stored Procedure").click();

    // Type stored procedure id and use stock procedure
    const storedProcedureIdTextBox = explorer.frame.getByLabel("Stored procedure id");
    await storedProcedureIdTextBox.isVisible();
    const storedProcedureName = `stored-procedure-${testInfo.testId}`;
    await storedProcedureIdTextBox.fill(storedProcedureName);

    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully created stored procedure ${storedProcedureName}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Execute stored procedure
    const executeButton = explorer.commandBarButton(CommandBarButton.Execute);
    await executeButton.click();
    const executeSidePanelButton = explorer.frame.getByTestId("Panel/OkButton");
    await executeSidePanelButton.click();

    const executeStoredProcedureResult = explorer.frame.getByLabel("Execute stored procedure result");
    await expect(executeStoredProcedureResult).toBeAttached({
      timeout: ONE_MINUTE_MS,
    });

    // Delete stored procedure
    await containerNode.expand();
    const storedProceduresNode = await explorer.waitForNode(
      `${context.database.id}/${context.container.id}/Stored Procedures`,
    );
    await storedProceduresNode.expand();
    const storedProcedureNode = await explorer.waitForNode(
      `${context.database.id}/${context.container.id}/Stored Procedures/${storedProcedureName}`,
    );

    await storedProcedureNode.openContextMenu();
    await storedProcedureNode.contextMenuItem("Delete Stored Procedure").click();
    const deleteStoredProcedureButton = explorer.frame.getByTestId("DialogButton:Delete");
    await deleteStoredProcedureButton.click();

    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully deleted stored procedure ${storedProcedureName}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });
});
