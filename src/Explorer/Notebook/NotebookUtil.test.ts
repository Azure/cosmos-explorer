import {
  CodeCellParams,
  ImmutableNotebook,
  makeCodeCell,
  makeMarkdownCell,
  makeNotebookRecord,
  MarkdownCellParams,
  MediaBundle,
} from "@nteract/commutable";
import { List, Map } from "immutable";
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
const notebookRecord = makeNotebookRecord({
  cellOrder: List.of("0", "1", "2", "3"),
  cellMap: Map({
    "0": makeMarkdownCell({
      cell_type: "markdown",
      source: "abc",
      metadata: undefined,
    } as MarkdownCellParams),
    "1": makeCodeCell({
      cell_type: "code",
      execution_count: undefined,
      metadata: undefined,
      source: "print(5)",
      outputs: List.of({
        name: "stdout",
        output_type: "stream",
        text: "5",
      }),
    } as CodeCellParams),
    "2": makeCodeCell({
      cell_type: "code",
      execution_count: undefined,
      metadata: undefined,
      source: 'display(HTML("<h1>Sample html</h1>"))',
      outputs: List.of({
        data: Object.freeze({
          "text/html": "<h1>Sample output</h1>",
          "text/plain": "<IPython.core.display.HTML object>",
        } as MediaBundle),
        output_type: "display_data",
        metadata: undefined,
      }),
    } as CodeCellParams),
    "3": makeCodeCell({
      cell_type: "code",
      execution_count: undefined,
      metadata: undefined,
      source: 'print("hello world")',
      outputs: List.of({
        name: "stdout",
        output_type: "stream",
        text: "hello world",
      }),
    } as CodeCellParams),
  }),
  nbformat_minor: 2,
  nbformat: 2,
  metadata: undefined,
});

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
        gitHubNotebookUri.replace(notebookName, "newName")
      );
    });
  });

  describe("findFirstCodeCellWithDisplay", () => {
    it("works for Notebook file", () => {
      const notebookObject = notebookRecord as ImmutableNotebook;
      expect(NotebookUtil.findCodeCellWithDisplay(notebookObject)[0]).toEqual("1");
    });
  });
});
