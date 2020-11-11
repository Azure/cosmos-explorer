import "expect-puppeteer";
import { ElementHandle } from "puppeteer";
import { getTestExplorerFrame } from "./notebookTestUtils";
import * as path from "path"

jest.setTimeout(300000);
const NOTEBOOK_OPERATION_DELAY = 2500;
const RENDER_DELAY = 1000;

describe("sample", () => {
  it("portal login", async () => {
    const frame = await getTestExplorerFrame();

    const notebookResourceTree = await frame.waitForSelector(".notebookResourceTree");
    const uploadNotebookPath = "C:/Users/srnara/Downloads/GettingStarted.ipynb";
    const uploadNotebookName = path.basename(uploadNotebookPath);

    const treeNodeHeadersBeforeUpload = await notebookResourceTree.$$(".treeNodeHeader");

    let ellipses = await treeNodeHeadersBeforeUpload[2].$("button");
    await ellipses.click();

    await frame.waitFor(RENDER_DELAY);

    let menuItems = await frame.$$(".ms-ContextualMenu-item");
    await menuItems[4].click();

    const uploadFileButton = await frame.waitForSelector("#importFileButton");
    uploadFileButton.click();

    const fileChooser = await page.waitForFileChooser();
    fileChooser.accept([uploadNotebookPath]);

    const submitButton = await frame.waitForSelector("#uploadFileButton");
    await submitButton.click();

    await frame.waitFor(NOTEBOOK_OPERATION_DELAY);

    let uploadedNotebookNode: ElementHandle<Element>;
    const treeNodeHeadersAfterUpload = await notebookResourceTree.$$(".treeNodeHeader");
    for (var i = 1; i < treeNodeHeadersAfterUpload.length; i++) {
      uploadedNotebookNode = treeNodeHeadersAfterUpload[i];
      const nodeLabel = await uploadedNotebookNode.$eval(".nodeLabel", element => element.textContent);
      if (nodeLabel === uploadNotebookName) {
        break;
      }
    }

    await uploadedNotebookNode.click();
    await frame.waitForSelector(".tabNavText");
    const tabTitle = await frame.$eval(".tabNavText", element => element.textContent);
    expect(tabTitle).toEqual(uploadNotebookName);

    const closeIcon = await frame.waitForSelector(".close-Icon");
    await closeIcon.click();

    ellipses = await uploadedNotebookNode.$(".treeMenuEllipsis");
    await ellipses.click();

    await frame.waitFor(RENDER_DELAY);

    menuItems = await frame.$$(".ms-ContextualMenu-item");
    await menuItems[1].click();

    const deleteAcceptButton = await frame.waitForSelector(".ms-Dialog-action");
    await deleteAcceptButton.click();
    await frame.waitFor(NOTEBOOK_OPERATION_DELAY);

    let index: number;
    let deletedNotebookNode: ElementHandle<Element>;
    const treeNodeHeadersAfterDelete = await notebookResourceTree.$$(".treeNodeHeader");
    for (index = 1; index < treeNodeHeadersAfterDelete.length; index++) {
      deletedNotebookNode = treeNodeHeadersAfterDelete[index];
      const nodeLabel = await deletedNotebookNode.$eval(".nodeLabel", element => element.textContent);
      if (nodeLabel === uploadNotebookName) {
        break;
      }
    }

    expect(index).toEqual(treeNodeHeadersAfterDelete.length);
  });
});
