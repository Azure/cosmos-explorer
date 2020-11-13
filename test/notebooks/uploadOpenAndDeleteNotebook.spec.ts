import "expect-puppeteer";
import { deleteNotebook, getNotebookNode, getTestExplorerFrame, uploadNotebook } from "./notebookTestUtils";
import * as path from "path";

jest.setTimeout(300000);

describe("Notebook UI tests", () => {
  it("Upload, Open and Delete Notebook", async () => {
    const frame = await getTestExplorerFrame();
    const uploadNotebookName = "GettingStarted.ipynb";
    const uploadNotebookPath = path.join(__dirname, "testNotebooks", uploadNotebookName);

    await uploadNotebook(frame, uploadNotebookPath);
    const uploadedNotebookNode = await getNotebookNode(frame, uploadNotebookName);

    await uploadedNotebookNode.click();
    await frame.waitForSelector(".tabNavText");
    const tabTitle = await frame.$eval(".tabNavText", element => element.textContent);
    expect(tabTitle).toEqual(uploadNotebookName);
    const closeIcon = await frame.waitForSelector(".close-Icon");
    await closeIcon.click();

    await deleteNotebook(frame, uploadedNotebookNode);
    const deletedNotebookNode = await getNotebookNode(frame, uploadNotebookName);
    expect(deletedNotebookNode).toBeUndefined();
  });
});
