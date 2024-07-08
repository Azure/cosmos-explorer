import { expect, test } from "@playwright/test";
import { DataExplorer, TestAccount } from "../fx";

test("Self Serve", async ({ page }) => {
  const explorer = await DataExplorer.open(page, TestAccount.SQL, "selfServe.html");

  const loggingToggle = explorer.frame.locator("#enableLogging-toggle-input");
  await expect(loggingToggle).toBeEnabled();

  explorer.frame.locator("#regions-dropdown-input").selectOption({ index: 0 });

  const currentRegionLabel = explorer.frame.getByLabel("Current Region");
  await currentRegionLabel.waitFor();
  await expect(currentRegionLabel).toHaveText(/current region selected is .*/);
  await expect(loggingToggle).toBeDisabled();

  await explorer.frame.locator("#enableDbLevelThroughput-toggle-input").click();
  const slider = explorer.frame.getByLabel("Database Throughput");
  await slider.waitFor();
  await expect(slider).toBeAttached();
});
