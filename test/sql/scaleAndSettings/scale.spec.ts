import { Browser, expect, Locator, Page, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K,
  TEST_MANUAL_THROUGHPUT_RU_2K,
  TestAccount,
} from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

interface SetupResult {
  context: TestContainerContext;
  page: Page;
  explorer: DataExplorer;
}

test.describe("Autoscale throughput", () => {
  let setup: SetupResult;

  test.beforeAll(async ({ browser }) => {
    setup = await openScaleTab(browser);

    // Switch manual -> autoscale once for this suite
    const autoscaleRadioButton = setup.explorer.frame.getByText("Autoscale", { exact: true });
    await autoscaleRadioButton.click();
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    await setup.explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(setup.explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${setup.context.container.id}`,
      { timeout: 2 * ONE_MINUTE_MS },
    );
  });

  test.afterAll(async () => {
    await cleanup(setup);
  });

  test("Update autoscale max throughput", async () => {
    await getThroughputInput(setup.explorer, "autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_2K.toString());
    await setup.explorer.commandBarButton(CommandBarButton.Save).click();

    await expect(setup.explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${setup.context.container.id}`,
      { timeout: 2 * ONE_MINUTE_MS },
    );
  });

  test("Update autoscale max throughput passed allowed limit", async () => {
    const softAllowedMaxThroughputString = await setup.explorer.frame
      .getByTestId("soft-allowed-maximum-throughput")
      .innerText();
    const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

    await getThroughputInput(setup.explorer, "autopilot").fill((softAllowedMaxThroughput * 10).toString());
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(delayedApplyWarning(setup.explorer)).toBeVisible();
  });

  test("Update autoscale max throughput with invalid increment", async () => {
    await getThroughputInput(setup.explorer, "autopilot").fill("1100");
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(getThroughputInputErrorMessage(setup.explorer, "autopilot")).toContainText(
      "Throughput value must be in increments of 1000",
    );
  });
});

test.describe("Manual throughput", () => {
  let setup: SetupResult;

  test.beforeAll(async ({ browser }) => {
    setup = await openScaleTab(browser);
  });

  test.afterAll(async () => {
    await cleanup(setup);
  });

  test("Update manual throughput", async () => {
    await getThroughputInput(setup.explorer, "manual").fill(TEST_MANUAL_THROUGHPUT_RU_2K.toString());
    await setup.explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(setup.explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated offer for collection ${setup.context.container.id}`,
      { timeout: 2 * ONE_MINUTE_MS },
    );
  });

  test("Update manual throughput passed allowed limit", async () => {
    const softAllowedMaxThroughputString = await setup.explorer.frame
      .getByTestId("soft-allowed-maximum-throughput")
      .innerText();
    const softAllowedMaxThroughput = Number(softAllowedMaxThroughputString.replace(/,/g, ""));

    await getThroughputInput(setup.explorer, "manual").fill((softAllowedMaxThroughput * 10).toString());
    await expect(delayedApplyWarning(setup.explorer)).toBeVisible();
  });
});

test("Remove a hot partition key rate limiting policy", async ({ browser }) => {
  const setup = await openScaleTab(browser);
  try {
    const policyToggle = setup.explorer.frame.getByRole("switch", { name: "Override default rate limiting policy" });
    test.skip(!(await policyToggle.isVisible()), "Account does not support hot partition key throttling");
    const policySaveMessage =
      "Hot partition key throttling policy saved successfully. Wait 10 minutes before attempting another change.";

    await policyToggle.click();
    await setup.explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(policyToggle).toBeChecked();
    await expect(setup.explorer.getConsoleHeaderStatus()).toHaveText(policySaveMessage);

    await policyToggle.click();
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    await setup.explorer.commandBarButton(CommandBarButton.Save).click();
    await expect(setup.explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    await expect(policyToggle).not.toBeChecked();
    await expect(setup.explorer.getConsoleHeaderStatus()).toHaveText(policySaveMessage);

    const reopenedExplorer = await DataExplorer.open(setup.page, TestAccount.SQL);
    await reopenedExplorer.openScaleAndSettings(setup.context);
    await reopenedExplorer.frame.getByTestId("settings-tab-header/ScaleTab").click();
    await expect(
      reopenedExplorer.frame.getByRole("switch", { name: "Override default rate limiting policy" }),
    ).not.toBeChecked();
  } finally {
    await cleanup(setup);
    await setup.page.close();
  }
});

const delayedApplyWarning = (explorer: DataExplorer): Locator =>
  explorer.frame.locator("#updateThroughputDelayedApplyWarningMessage");

const getThroughputInput = (explorer: DataExplorer, type: "manual" | "autopilot"): Locator =>
  explorer.frame.getByTestId(`${type}-throughput-input`);

const getThroughputInputErrorMessage = (explorer: DataExplorer, type: "manual" | "autopilot"): Locator =>
  explorer.frame.getByTestId(`${type}-throughput-input-error`);

async function openScaleTab(browser: Browser): Promise<SetupResult> {
  const context = await createTestSQLContainer();
  const page = await browser.newPage();
  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await explorer.openScaleAndSettings(context);
  await explorer.frame.getByTestId("settings-tab-header/ScaleTab").click();

  return { context, page, explorer };
}

async function cleanup({ context }: Partial<SetupResult>) {
  await context?.dispose();
}
