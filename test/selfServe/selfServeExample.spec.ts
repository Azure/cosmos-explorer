import { getAzureCLICredentialsToken } from "../utils/shared";

test("Self Serve", async () => {
  // We can't retrieve AZ CLI credentials from the browser so we get them here.
  const token = await getAzureCLICredentialsToken();

  await page.goto(`https://localhost:1234/testExplorer.html?iframeSrc=selfServe.html&token=${token}`);
  const handle = await page.waitForSelector("iframe");
  const frame = await handle.contentFrame();

  // wait for refresh RP call to end
  await page.waitForTimeout(10000);

  // id of the display element is in the format {PROPERTY_NAME}-{DISPLAY_NAME}-{DISPLAY_TYPE}
  await frame.waitForSelector("#description-text-display");

  const regions = await frame.waitForSelector("#regions-dropdown-input");

  const currentRegionsDescription = await frame.$$("#currentRegionText-text-display");
  expect(currentRegionsDescription).toHaveLength(0);
  let disabledLoggingToggle = await frame.$$("#enableLogging-toggle-input[disabled]");
  expect(disabledLoggingToggle).toHaveLength(0);

  await regions.click();
  const regionsDropdownElement1 = await frame.waitForSelector("#regions-dropdown-input-list0");
  await regionsDropdownElement1.click();

  await frame.waitForSelector("#currentRegionText-text-display");
  disabledLoggingToggle = await frame.$$("#enableLogging-toggle-input[disabled]");
  expect(disabledLoggingToggle).toHaveLength(1);

  await frame.waitForSelector("#accountName-textField-input");

  const enableDbLevelThroughput = await frame.waitForSelector("#enableDbLevelThroughput-toggle-input");
  const dbThroughput = await frame.$$("#dbThroughput-slider-input");
  expect(dbThroughput).toHaveLength(0);
  await enableDbLevelThroughput.click();
  await frame.waitForSelector("#dbThroughput-slider-input");

  await frame.waitForSelector("#collectionThroughput-spinner-input");
});
