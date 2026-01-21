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

    // Click Scale & Settings and open Settings tab
    await explorer.openScaleAndSettings(context);
    const settingsTab = explorer.frame.getByTestId("settings-tab-header/SubSettingsTab");
    await settingsTab.click();
  });

    test.afterEach("Delete Test Database", async () => {
      await context?.dispose();
    });

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

  test("Set Geospatial Config to Geometry then Geography", async () => {
    const geometryRadioButton = explorer.frame.getByRole("radio", { name: "geometry-option" });
    await geometryRadioButton.click();

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );

    const geographyRadioButton = explorer.frame.getByRole("radio", { name: "geography-option" });
    await geographyRadioButton.click();

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  });
});
