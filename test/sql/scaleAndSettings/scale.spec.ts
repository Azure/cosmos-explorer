import { expect, Locator, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K,
  TEST_MANUAL_THROUGHPUT_RU_2K,
  TestAccount,
} from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe.serial("Autoscale and Manual throughput", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeEach("Create Test Database & Open container settings", async ({ page }) => {
    context = await createTestSQLContainer();
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings and open Scale tab
    await explorer.openScaleAndSettings(context);
    const scaleTab = explorer.frame.getByTestId("settings-tab-header/ScaleTab");
    await scaleTab.click();
  });

  test.afterEach("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Update autoscale max throughput", async () => {
    // By default the created container has manual throughput (Containers created via JS SDK v4.7.0 cannot be created with autoscale throughput)
    await switchManualToAutoscaleThroughput();

    // Update autoscale max throughput
    await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K.toString());

    // Save
    await explorer.commandBarButton(CommandBarButton.Save).click();

    // Read console message
    await expect(explorer.getConsoleMessage()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Update autoscale max throughput passed allowed limit", async () => {
    // By default the created container has manual throughput (Containers created via JS SDK v4.7.0 cannot be created with autoscale throughput)
    await switchManualToAutoscaleThroughput();

    // Get soft allowed max throughput and remove commas
    const softAllowedMaxThroughputString = await explorer.frame
      .getByTestId("soft-allowed-maximum-throughput")
      .innerText();
    const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

    // Try to set autoscale max throughput above allowed limit
    await getThroughputInput("autopilot").fill((softAllowedMaxThroughput * 10).toString());
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(getThroughputInputErrorMessage("autopilot")).toContainText(
      "This update isn't possible because it would increase the total throughput",
    );
  });

  test("Update autoscale max throughput with invalid increment", async () => {
    // By default the created container has manual throughput (Containers created via JS SDK v4.7.0 cannot be created with autoscale throughput)
    await switchManualToAutoscaleThroughput();

    // Try to set autoscale max throughput with invalid increment
    await getThroughputInput("autopilot").fill("1100");
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(getThroughputInputErrorMessage("autopilot")).toContainText(
      "Throughput value must be in increments of 1000",
    );
  });

  test("Update manual throughput", async () => {
    await getThroughputInput("manual").fill(TEST_MANUAL_THROUGHPUT_RU_2K.toString());
    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleMessage()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Update manual throughput passed allowed limit", async () => {
    // Get soft allowed max throughput and remove commas
    const softAllowedMaxThroughputString = await explorer.frame
      .getByTestId("soft-allowed-maximum-throughput")
      .innerText();
    const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

    // Try to set manual throughput above allowed limit
    await getThroughputInput("manual").fill((softAllowedMaxThroughput * 10).toString());
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(getThroughputInputErrorMessage("manual")).toContainText(
      "This update isn't possible because it would increase the total throughput",
    );
  });

  // Helper methods
  const getThroughputInput = (type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input`);
  };

  const getThroughputInputErrorMessage = (type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input-error`);
  };

  const switchManualToAutoscaleThroughput = async (): Promise<void> => {
    const autoscaleRadioButton = explorer.frame.getByText("Autoscale", { exact: true });
    await autoscaleRadioButton.click();
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleMessage()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  };
});
