import { expect, test } from "@playwright/test";
import { DataExplorer, TestAccount } from "../fx";

test("Self Serve", async ({ page }) => {
  const explorer = await DataExplorer.open(page, TestAccount.SQL, "selfServe.html");

  const loggingToggle = explorer.frame.locator("#enableLogging-toggle-input");
  await expect(loggingToggle).toBeEnabled();

  const regionDropdown = explorer.frame.getByText("Select a region");
  await regionDropdown.click();
  await explorer.frame.getByRole("option").first().click();

  const currentRegionLabel = explorer.frame.getByLabel("Current Region");
  await currentRegionLabel.waitFor();
  await expect(currentRegionLabel).toHaveText(/current region selected is .*/);
  await expect(loggingToggle).toBeDisabled();

  await explorer.frame.locator("#enableDbLevelThroughput-toggle-input").click();
  const slider = explorer.frame.getByLabel("Database Throughput");
  await slider.waitFor();
  await expect(slider).toBeAttached();
});
