import { expect, Locator, Page, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K,
  TEST_MANUAL_THROUGHPUT_RU_2K,
  TestAccount,
} from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Autoscale and Manual throughput", () => {
  const withScaleTab = async (
    page: Page,
    run: (args: { context: TestContainerContext; explorer: DataExplorer }) => Promise<void>,
  ): Promise<void> => {
    const context = await createTestSQLContainer();
    try {
      const explorer = await DataExplorer.open(page, TestAccount.SQL);

      await explorer.openScaleAndSettings(context);
      await explorer.frame.getByTestId("settings-tab-header/ScaleTab").click();

      await run({ context, explorer });
    } finally {
      await context.dispose();
    }
  };

  const getThroughputInput = (explorer: DataExplorer, type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input`);
  };

  const getThroughputInputErrorMessage = (explorer: DataExplorer, type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input-error`);
  };

  const switchManualToAutoscaleThroughput = async (explorer: DataExplorer, containerId: string): Promise<void> => {
    const autoscaleRadioButton = explorer.frame.getByText("Autoscale", { exact: true });
    await autoscaleRadioButton.click();

    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    await explorer.commandBarButton(CommandBarButton.Save).click();

    await expect(explorer.getConsoleMessage()).toContainText(
      `Successfully updated offer for collection ${containerId}`,
      {
        timeout: ONE_MINUTE_MS,
      },
    );
  };

  test("Update autoscale max throughput", async ({ page }) => {
    await withScaleTab(page, async ({ context, explorer }) => {
      await switchManualToAutoscaleThroughput(explorer, context.container.id);

      await getThroughputInput(explorer, "autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K.toString());
      await explorer.commandBarButton(CommandBarButton.Save).click();

      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for collection ${context.container.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });

  test("Update autoscale max throughput passed allowed limit", async ({ page }) => {
    await withScaleTab(page, async ({ context, explorer }) => {
      await switchManualToAutoscaleThroughput(explorer, context.container.id);

      const softAllowedMaxThroughputString = await explorer.frame
        .getByTestId("soft-allowed-maximum-throughput")
        .innerText();
      const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

      await getThroughputInput(explorer, "autopilot").fill((softAllowedMaxThroughput * 10).toString());
      await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
      await expect(getThroughputInputErrorMessage(explorer, "autopilot")).toContainText(
        "This update isn't possible because it would increase the total throughput",
      );
    });
  });

  test("Update autoscale max throughput with invalid increment", async ({ page }) => {
    await withScaleTab(page, async ({ context, explorer }) => {
      await switchManualToAutoscaleThroughput(explorer, context.container.id);

      await getThroughputInput(explorer, "autopilot").fill("1100");
      await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
      await expect(getThroughputInputErrorMessage(explorer, "autopilot")).toContainText(
        "Throughput value must be in increments of 1000",
      );
    });
  });

  test("Update manual throughput", async ({ page }) => {
    await withScaleTab(page, async ({ context, explorer }) => {
      await getThroughputInput(explorer, "manual").fill(TEST_MANUAL_THROUGHPUT_RU_2K.toString());
      await explorer.commandBarButton(CommandBarButton.Save).click();

      await expect(explorer.getConsoleMessage()).toContainText(
        `Successfully updated offer for collection ${context.container.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });

  test("Update manual throughput passed allowed limit", async ({ page }) => {
    await withScaleTab(page, async ({ explorer }) => {
      const softAllowedMaxThroughputString = await explorer.frame
        .getByTestId("soft-allowed-maximum-throughput")
        .innerText();
      const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

      await getThroughputInput(explorer, "manual").fill((softAllowedMaxThroughput * 10).toString());
      await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
      await expect(getThroughputInputErrorMessage(explorer, "manual")).toContainText(
        "This update isn't possible because it would increase the total throughput",
      );
    });
  });
});
