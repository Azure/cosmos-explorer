import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Settings under Scale & Settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database & Open Settings tab", async ({ browser }) => {
    context = await createTestSQLContainer();
    const page = await browser.newPage();
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings and open Scale tab
    await explorer.openScaleAndSettings(context);
    const settingsTab = explorer.frame.getByTestId("settings-tab-header/SubSettingsTab");
    await settingsTab.click();
  });

  // test.beforeEach("Open container settings", async ({ page }) => {
  //   explorer = await DataExplorer.open(page, TestAccount.SQL);

  //   // Click Scale & Settings and open Scale tab
  //   await explorer.openScaleAndSettings(context);
  //   const settingsTab = explorer.frame.getByTestId("settings-tab-header/SubSettingsTab");
  //   await settingsTab.click();
  // });

  if (!process.env.CI) {
    test.afterAll("Delete Test Database", async () => {
      await context?.dispose();
    });
  }
  // if (!process.env.CI) {
  //   test.afterAll("Delete Test Database", async () => {
  //     await context?.dispose();
  //   });
  // }

  test("Update TTL to On (no default)", async () => {
    const ttlOnNoDefaultRadioButton = explorer.frame.getByRole("radio", { name: "ttl-on-no-default-option" });
    await ttlOnNoDefaultRadioButton.click();

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Update TTL to On (with user entry)", async () => {
    const ttlOnRadioButton = explorer.frame.getByRole("radio", { name: "ttl-on-option" });
    await ttlOnRadioButton.click();

    // Enter TTL seconds
    const ttlInput = explorer.frame.getByTestId("ttl-input");
    await ttlInput.fill("30000");

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });
});
