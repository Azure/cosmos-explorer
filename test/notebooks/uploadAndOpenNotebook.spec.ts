import "expect-puppeteer";
import { getTestExplorerFrame, uploadNotebookIfNotExist } from "./notebookTestUtils";
import { ElementHandle, Frame } from "puppeteer";

jest.setTimeout(300000);

const notebookName = "GettingStarted.ipynb";
let frame: Frame;
let uploadedNotebookNode: ElementHandle<Element>;

describe("Notebook UI tests", () => {
  it("Upload, Open and Delete Notebook", async () => {
    try {
      frame = await getTestExplorerFrame();
      uploadedNotebookNode = await uploadNotebookIfNotExist(frame, notebookName);
      await uploadedNotebookNode.click();
      await frame.waitForSelector(".tabNavText");
      const tabTitle = await frame.$eval(".tabNavText", element => element.textContent);
      expect(tabTitle).toEqual(notebookName);
      const closeIcon = await frame.waitForSelector(".close-Icon");
      await closeIcon.click();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
