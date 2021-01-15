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
      await frame.waitForSelector(".ms-Dropdown");
      const dropdownLabel = await frame.$eval(".ms-Dropdown-label", element => element.textContent);
      expect(dropdownLabel).toEqual("Regions");
      await frame.waitForSelector(".radioSwitchComponent");
      await frame.waitForSelector(".ms-TextField");
      await frame.waitForSelector(".ms-Slider ");
      await frame.waitForSelector(".ms-spinButton-input");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
