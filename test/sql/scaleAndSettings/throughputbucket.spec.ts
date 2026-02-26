import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Throughput bucket settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeEach("Create Test Database & Open Throughput Bucket Settings", async ({ browser }) => {
    context = await createTestSQLContainer();
    const page = await browser.newPage();
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings and open Throughput Bucket Settings tab
    await explorer.openScaleAndSettings(context);
    const throughputBucketTab = explorer.frame.getByTestId("settings-tab-header/ThroughputBucketsTab");
    await throughputBucketTab.click();
  });

  // Delete database only if not running in CI
  if (!process.env.CI) {
    test.afterEach("Delete Test Database", async () => {
      await context?.dispose();
    });
  }

  test("Activate throughput bucket #2", async () => {
    // Activate bucket 2
    const bucket2Toggle = explorer.frame.getByTestId("bucket-2-active-toggle");
    await bucket2Toggle.click();

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Activate throughput buckets #1 and #2", async () => {
    // Activate bucket 1
    const bucket1Toggle = explorer.frame.getByTestId("bucket-1-active-toggle");
    await bucket1Toggle.click();

    // Activate bucket 2
    const bucket2Toggle = explorer.frame.getByTestId("bucket-2-active-toggle");
    await bucket2Toggle.click();
    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Set throughput percentage for bucket #1", async () => {
    // Set throughput percentage for bucket 1 (inactive) - Should be disabled
    const bucket1PercentageInput = explorer.frame.getByTestId("bucket-1-percentage-input");
    expect(bucket1PercentageInput).toBeDisabled();

    // Activate bucket 1
    const bucket1Toggle = explorer.frame.getByTestId("bucket-1-active-toggle");
    await bucket1Toggle.click();
    expect(bucket1PercentageInput).toBeEnabled();
    await bucket1PercentageInput.fill("40");

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Set default throughput bucket", async () => {
    // There are no active throughput buckets so they all should be disabled
    const defaultThroughputBucketDropdown = explorer.frame.getByTestId("default-throughput-bucket-dropdown");
    await defaultThroughputBucketDropdown.click();

    const bucket1Option = explorer.frame.getByRole("option", { name: "Bucket 1" });
    expect(bucket1Option).toBeDisabled();

    // Activate bucket 1
    const bucket1Toggle = explorer.frame.getByTestId("bucket-1-active-toggle");
    await bucket1Toggle.click();

    // Open dropdown again
    await defaultThroughputBucketDropdown.click();
    expect(bucket1Option).toBeEnabled();

    // Select bucket 1 as default
    await bucket1Option.click();

    await explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });
});
