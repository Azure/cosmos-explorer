import { Frame } from "puppeteer";
import { TestExplorerParams } from "../testExplorer/TestExplorerParams";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";
import { SelfServeType } from "../../src/SelfServe/SelfServeUtils";

jest.setTimeout(300000);

let frame: Frame;
describe("Self Serve", () => {
  it("Launch Self Serve Example", async () => {
    try {
      frame = await getTestExplorerFrame(
        new Map<string, string>([[TestExplorerParams.selfServeType, SelfServeType.example]])
      );
      await frame.waitForSelector("#description-text-display");

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
