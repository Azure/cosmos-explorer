import { ElementHandle, Frame } from "puppeteer";
import { TestExplorerParams } from "./testExplorer/TestExplorerParams";
import * as path from "path";

export const NOTEBOOK_OPERATION_DELAY = 5000;
export const RENDER_DELAY = 2500;

let testExplorerFrame: Frame;
export const getTestExplorerFrame = async (): Promise<Frame> => {
  if (testExplorerFrame) {
    return testExplorerFrame;
  }

  const notebooksTestRunnerTenantId = process.env.NOTEBOOKS_TEST_RUNNER_TENANT_ID;
  const notebooksTestRunnerClientId = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_ID;
  const notebooksTestRunnerClientSecret = process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET;
  const portalRunnerDatabaseAccount = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT;
  const portalRunnerDatabaseAccountKey = process.env.PORTAL_RUNNER_DATABASE_ACCOUNT_KEY;
  const portalRunnerSubscripton = process.env.PORTAL_RUNNER_SUBSCRIPTION;
  const portalRunnerResourceGroup = process.env.PORTAL_RUNNER_RESOURCE_GROUP;

  const testExplorerUrl = new URL("testExplorer.html", "https://localhost:1234");
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerTenantId,
    encodeURI(notebooksTestRunnerTenantId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientId,
    encodeURI(notebooksTestRunnerClientId)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.notebooksTestRunnerClientSecret,
    encodeURI(notebooksTestRunnerClientSecret)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerDatabaseAccount,
    encodeURI(portalRunnerDatabaseAccount)
  );
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerDatabaseAccountKey,
    encodeURI(portalRunnerDatabaseAccountKey)
  );
  testExplorerUrl.searchParams.append(TestExplorerParams.portalRunnerSubscripton, encodeURI(portalRunnerSubscripton));
  testExplorerUrl.searchParams.append(
    TestExplorerParams.portalRunnerResourceGroup,
    encodeURI(portalRunnerResourceGroup)
  );

  await page.goto(testExplorerUrl.toString());

  const handle = await page.waitForSelector("iframe");
  testExplorerFrame = await handle.contentFrame();
  await testExplorerFrame.waitForSelector(".galleryHeader");
  return testExplorerFrame;
};

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
