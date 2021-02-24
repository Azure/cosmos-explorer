import { Frame } from "puppeteer";
import { TestExplorerParams } from "../testExplorer/TestExplorerParams";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";
import { SelfServeType } from "../../src/SelfServe/SelfServeUtils";
import { ApiKind } from "../../src/Contracts/DataModels";

jest.setTimeout(300000);

let frame: Frame;
describe("Self Serve", () => {
  it("Launch Self Serve Example", async () => {
    try {
      frame = await getTestExplorerFrame(
        ApiKind.SQL,
        new Map<string, string>([[TestExplorerParams.selfServeType, SelfServeType.example]])
      );

      // wait for refresh RP call to end
      await frame.waitFor(10000);

      // id of the display element is in the format {PROPERTY_NAME}-{DISPLAY_NAME}-{DISPLAY_TYPE}
      await frame.waitForSelector("#description-text-display");
      await frame.waitForSelector("#currentRegionText-text-display");

      const regions = await frame.waitForSelector("#regions-dropdown-input");
      let disabledLoggingToggle = await frame.$$("#enableLogging-toggle-input[disabled]");
      expect(disabledLoggingToggle).toHaveLength(0);
      await regions.click();
      const regionsDropdownElement1 = await frame.waitForSelector("#regions-dropdown-input-list0");
      await regionsDropdownElement1.click();
      disabledLoggingToggle = await frame.$$("#enableLogging-toggle-input[disabled]");
      expect(disabledLoggingToggle).toHaveLength(1);

      await frame.waitForSelector("#accountName-textField-input");

      const enableDbLevelThroughput = await frame.waitForSelector("#enableDbLevelThroughput-toggle-input");
      const dbThroughput = await frame.$$("#dbThroughput-slider-input");
      expect(dbThroughput).toHaveLength(0);
      await enableDbLevelThroughput.click();
      await frame.waitForSelector("#dbThroughput-slider-input");

      await frame.waitForSelector("#collectionThroughput-spinner-input");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
