import { NotebookUtil } from "./NotebookUtil";

const fileName = "file";
const notebookName = "file.ipynb";
const folderPath = "folder";
const filePath = `${folderPath}/${fileName}`;
const notebookPath = `${folderPath}/${notebookName}`;

describe("NotebookUtil", () => {
  describe("isNotebookFile", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.isNotebookFile(filePath)).toBeFalsy();
      expect(NotebookUtil.isNotebookFile(notebookPath)).toBeTruthy();
    });
  });

  describe("getFilePath", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getFilePath(folderPath, fileName)).toEqual(filePath);
    });
  });

  describe("getParentPath", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getParentPath(filePath)).toEqual(folderPath);
    });
  });

  describe("getName", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.getName(filePath)).toEqual(fileName);
      expect(NotebookUtil.getName(notebookPath)).toEqual(notebookName);
    });
  });

  describe("replaceName", () => {
    it("works for jupyter file paths", () => {
      expect(NotebookUtil.replaceName(filePath, "newName")).toEqual(filePath.replace(fileName, "newName"));
      expect(NotebookUtil.replaceName(notebookPath, "newName")).toEqual(notebookPath.replace(notebookName, "newName"));
    });
  });
});
