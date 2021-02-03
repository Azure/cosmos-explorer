import { Frame } from "puppeteer";
import { ApiKind } from "../../src/Contracts/DataModels";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";

jest.setTimeout(300000);

let frame: Frame;

describe("Mongo", () => {
  it("Account opens", async () => {
    try {
      frame = await getTestExplorerFrame(ApiKind.MongoDB);
      await frame.waitForSelector(".accordion");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
