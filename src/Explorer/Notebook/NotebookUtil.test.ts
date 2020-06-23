import { NotebookUtil } from "./NotebookUtil";
import * as GitHubUtils from "../../Utils/GitHubUtils";

const fileName = "file";
const notebookName = "file.ipynb";
const filePath = `folder/${fileName}`;
const notebookPath = `folder/${notebookName}`;
const gitHubFileUri = GitHubUtils.toContentUri("owner", "repo", "branch", filePath);
const gitHubNotebookUri = GitHubUtils.toContentUri("owner", "repo", "branch", notebookPath);

describe("NotebookUtil", () => {
  describe("isNotebookFile", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.isNotebookFile(filePath)).toBeFalsy();
      expect(NotebookUtil.isNotebookFile(notebookPath)).toBeTruthy();
    });

    it("works for github file uris", () => {
      expect(NotebookUtil.isNotebookFile(gitHubFileUri)).toBeFalsy();
      expect(NotebookUtil.isNotebookFile(gitHubNotebookUri)).toBeTruthy();
    });
  });

  describe("getName", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getName(filePath)).toEqual(fileName);
      expect(NotebookUtil.getName(notebookPath)).toEqual(notebookName);
    });

    it("works for github file uris", () => {
      expect(NotebookUtil.getName(gitHubFileUri)).toEqual(fileName);
      expect(NotebookUtil.getName(gitHubNotebookUri)).toEqual(notebookName);
    });
  });

  describe("replaceName", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.replaceName(filePath, "newName")).toEqual(filePath.replace(fileName, "newName"));
      expect(NotebookUtil.replaceName(notebookPath, "newName")).toEqual(notebookPath.replace(notebookName, "newName"));
    });

    it("works for github file uris", () => {
      expect(NotebookUtil.replaceName(gitHubFileUri, "newName")).toEqual(gitHubFileUri.replace(fileName, "newName"));
      expect(NotebookUtil.replaceName(gitHubNotebookUri, "newName")).toEqual(
        gitHubNotebookUri.replace(notebookName, "newName")
      );
    });
  });
});
