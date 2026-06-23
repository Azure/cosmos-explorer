import * as GitHubUtils from "../../Utils/GitHubUtils";
import { NotebookUtil } from "./NotebookUtil";

const fileName = "file";
const notebookName = "file.ipynb";
const folderPath = "folder";
const filePath = `${folderPath}/${fileName}`;
const notebookPath = `${folderPath}/${notebookName}`;
const gitHubFolderUri = GitHubUtils.toContentUri("owner", "repo", "branch", folderPath);
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

  describe("getFilePath", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getFilePath(folderPath, fileName)).toEqual(filePath);
    });

    it("works for github file uris", () => {
      expect(NotebookUtil.getFilePath(gitHubFolderUri, fileName)).toEqual(gitHubFileUri);
    });
  });

  describe("getParentPath", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getParentPath(filePath)).toEqual(folderPath);
    });

    it("works for github file uris", () => {
      expect(NotebookUtil.getParentPath(gitHubFileUri)).toEqual(gitHubFolderUri);
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
        gitHubNotebookUri.replace(notebookName, "newName"),
      );
    });
  });
});
