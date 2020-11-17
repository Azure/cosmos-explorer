import { ElementHandle, Frame } from "puppeteer";
import { TestExplorerParams } from "./testExplorer/TestExplorerParams";

export const NOTEBOOK_OPERATION_DELAY = 5000;
export const RENDER_DELAY = 1000;

let testExplorerFrame: Frame;
export const getTestExplorerFrame = async (): Promise<Frame> => {
  if (testExplorerFrame) {
    return testExplorerFrame;
  }

  const notebooksTestRunnerApplicationId = process.env.NOTEBOOKS_TEST_RUNNER_TENANT_ID;
  const notebooksTestRunnerClientId = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_ID;
  const notebooksTestRunnerClientSecret = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET;
  const notebooksAccountName = process.env.NOTEBOOKS_ACCOUNT_NAME;
  const notebooksAccountKey = process.env.NOTEBOOKS_ACCOUNT_KEY;
  const notebooksAccountSubscriptonId = process.env.NOTEBOOKS_ACCOUNT_SUBSCRIPTION_ID;
  const notebooksAccountResourceGroup = process.env.NOTEBOOKS_ACCOUNT_RESOURCE_GROUP;

  const testExplorerUrl = new URL("testExplorer.html", "https://localhost:1234");
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerApplicationId,
    encodeURI(notebooksTestRunnerApplicationId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientId,
    encodeURI(notebooksTestRunnerClientId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientSecret,
    encodeURI(notebooksTestRunnerClientSecret)
  );
  testExplorerUrl.searchParams.append(TestExplorerParams.notebooksAccountName, encodeURI(notebooksAccountName));
  testExplorerUrl.searchParams.append(TestExplorerParams.notebooksAccountKey, encodeURI(notebooksAccountKey));
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksAccountSubscriptonId,
    encodeURI(notebooksAccountSubscriptonId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksAccountResourceGroup,
    encodeURI(notebooksAccountResourceGroup)
  );

  await page.goto(testExplorerUrl.toString());

  const handle = await page.waitForSelector("iframe");
  testExplorerFrame = await handle.contentFrame();
  await testExplorerFrame.waitForSelector(".galleryHeader");
  return testExplorerFrame;
};

export const uploadNotebook = async (frame: Frame, uploadNotebookPath: string): Promise<void> => {
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
};

export const getNotebookNode = async (frame: Frame, uploadNotebookName: string): Promise<ElementHandle<Element>> => {
  const notebookResourceTree = await frame.waitForSelector(".notebookResourceTree");
  let currentNotebookNode: ElementHandle<Element>;

  const treeNodeHeaders = await notebookResourceTree.$$(".treeNodeHeader");
  for (let i = 1; i < treeNodeHeaders.length; i++) {
    currentNotebookNode = treeNodeHeaders[i];
    const nodeLabel = await currentNotebookNode.$eval(".nodeLabel", element => element.textContent);
    if (nodeLabel === uploadNotebookName) {
      return currentNotebookNode;
    }
  }
  return undefined;
};

export const deleteNotebook = async (frame: Frame, notebookNodeToDelete: ElementHandle<Element>): Promise<void> => {
  const ellipses = await notebookNodeToDelete.$(".treeMenuEllipsis");
  await ellipses.click();

  await frame.waitFor(RENDER_DELAY);

  const menuItems = await frame.$$(".ms-ContextualMenu-item");
  await menuItems[1].click();

  const deleteAcceptButton = await frame.waitForSelector(".ms-Dialog-action");
  await deleteAcceptButton.click();
  await frame.waitFor(NOTEBOOK_OPERATION_DELAY);
};
