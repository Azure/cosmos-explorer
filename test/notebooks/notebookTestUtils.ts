import * as path from "path";
import { ElementHandle, Frame } from "puppeteer";

export const NOTEBOOK_OPERATION_DELAY = 5000;
export const RENDER_DELAY = 2500;

export const uploadNotebookIfNotExist = async (frame: Frame, notebookName: string): Promise<ElementHandle<Element>> => {
  const notebookNode = await getNotebookNode(frame, notebookName);
  if (notebookNode) {
    return notebookNode;
  }

  const uploadNotebookPath = path.join(__dirname, "testNotebooks", notebookName);
  const notebookResourceTree = await frame.waitForSelector(".notebookResourceTree");
  const treeNodeHeadersBeforeUpload = await notebookResourceTree.$$(".treeNodeHeader");

  const ellipses = await treeNodeHeadersBeforeUpload[2].$("button");
  await ellipses.click();

  await frame.waitFor(RENDER_DELAY);

  const menuItems = await frame.$$(".ms-ContextualMenu-item");
  await menuItems[4].click();

  const uploadFileButton = await frame.waitForSelector("#importFileButton");
  uploadFileButton.click();

  const fileChooser = await page.waitForFileChooser();
  fileChooser.accept([uploadNotebookPath]);

  const submitButton = await frame.waitForSelector("#uploadFileButton");
  await submitButton.click();

  await frame.waitFor(NOTEBOOK_OPERATION_DELAY);
  return await getNotebookNode(frame, notebookName);
};

export const getNotebookNode = async (frame: Frame, uploadNotebookName: string): Promise<ElementHandle<Element>> => {
  const notebookResourceTree = await frame.waitForSelector(".notebookResourceTree");
  await frame.waitFor(RENDER_DELAY);
  let currentNotebookNode: ElementHandle<Element>;

  const treeNodeHeaders = await notebookResourceTree.$$(".treeNodeHeader");
  for (let i = 1; i < treeNodeHeaders.length; i++) {
    currentNotebookNode = treeNodeHeaders[i];
    const nodeLabel = await currentNotebookNode.$eval(".nodeLabel", (element) => element.textContent);
    if (nodeLabel === uploadNotebookName) {
      return currentNotebookNode;
    }
  }
  return undefined;
};
