import "expect-puppeteer";
import {
  deleteNotebook,
  getNotebookNode,
  getTestExplorerFrame,
  RENDER_DELAY,
  uploadNotebook
} from "./notebookTestUtils";
import * as path from "path";
import { ElementHandle, Frame } from "puppeteer";

jest.setTimeout(300000);

const notebookName = "GettingStarted.ipynb";
let frame: Frame;
let uploadedNotebookNode: ElementHandle<Element>;

describe("Notebook UI tests", () => {
  it("Upload, Open and Delete Notebook", async () => {
    try {
      frame = await getTestExplorerFrame();
      const uploadNotebookPath = path.join(__dirname, "testNotebooks", notebookName);
      await uploadNotebook(frame, uploadNotebookPath);
      uploadedNotebookNode = await getNotebookNode(frame, notebookName);

      await uploadedNotebookNode.click();
      await frame.waitForSelector(".tabNavText");
      const tabTitle = await frame.$eval(".tabNavText", element => element.textContent);
      expect(tabTitle).toEqual(notebookName);
      const closeIcon = await frame.waitForSelector(".close-Icon");
      await closeIcon.click();
      await frame.waitFor(RENDER_DELAY);

      await deleteNotebook(frame, uploadedNotebookNode);
      const deletedNotebookNode = await getNotebookNode(frame, notebookName);
      if (deletedNotebookNode) {
        throw new Error(`Deletion of notebook ${notebookName} failed`);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
