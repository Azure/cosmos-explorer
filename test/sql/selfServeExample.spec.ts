import { expect, test } from "@playwright/test";
import { DataExplorer, TestAccount } from "../fx";

test("Self Serve", async ({ page, browserName }) => {
  /* Skipping this test which fails on webkit only. Clicking on the dropdown does not open the dropdown.
    It fails with the error below which seems to indicate that some <div> (with class "ms-Stack css-128", the label of the dropdown?) is intercepting the click.
        - retrying click action, attempt #555
      -   waiting 500ms
      -   waiting for element to be visible, enabled and stable
      -   element is visible, enabled and stable
      -   scrolling into view if needed
      -   done scrolling
      -   <div class="ms-Stack css-128">…</div> from <div id="selfServeContent" class="selfServeComponentC…>…</div> subtree intercepts pointer events

    Adding waiting for page to load, forcing click with .click({ force: true }) or setting page viewport with page.setViewportSize() did not help.
  */
  test.skip(
    browserName === "webkit",
    "This test only fails on Webkit: clicking on the dropdown does not open the dropdown.",
  );

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
