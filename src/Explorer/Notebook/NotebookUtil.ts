import path from "path";
import { ImmutableNotebook, ImmutableCodeCell, ImmutableOutput } from "@nteract/commutable";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";
import { StringUtils } from "../../Utils/StringUtils";
import * as GitHubUtils from "../../Utils/GitHubUtils";

// Must match rx-jupyter' FileType
export type FileType = "directory" | "file" | "notebook";
// Utilities for notebooks
export class NotebookUtil {
  /**
   * It's a notebook file if the filename ends with .ipynb.
   */
  public static isNotebookFile(notebookPath: string): boolean {
    const fileName = NotebookUtil.getName(notebookPath);
    return !!fileName && StringUtils.endsWith(fileName, ".ipynb");
  }

  /**
   * Note: this does not connect the item to a parent in a tree.
   * @param name
   * @param path
   */
  public static createNotebookContentItem(name: string, path: string, type: FileType): NotebookContentItem {
    return {
      name,
      path,
      type: NotebookUtil.getType(type),
      timestamp: NotebookUtil.getCurrentTimestamp()
    };
  }

  /**
   * Convert rx-jupyter type to our type
   * @param type
   */
  public static getType(type: FileType): NotebookContentItemType {
    switch (type) {
      case "directory":
        return NotebookContentItemType.Directory;
      case "notebook":
        return NotebookContentItemType.Notebook;
      case "file":
        return NotebookContentItemType.File;
      default:
        throw new Error(`Unknown file type: ${type}`);
    }
  }

  public static getCurrentTimestamp(): number {
    return new Date().getTime();
  }

  /**
   * Override from kernel-lifecycle.ts to improve kernel selection:
   * Only return the kernel name persisted in the notebook
   *
   * @param filepath
   * @param notebook
   */
  public static extractNewKernel(filepath: string | null, notebook: ImmutableNotebook) {
    const cwd = (filepath && path.dirname(filepath)) || "/";

    const kernelSpecName =
      notebook.getIn(["metadata", "kernelspec", "name"]) || notebook.getIn(["metadata", "language_info", "name"]);

    return {
      cwd,
      kernelSpecName
    };
  }

  public static getName(path: string): undefined | string {
    let relativePath: string = path;
    const contentInfo = GitHubUtils.fromContentUri(path);
    if (contentInfo) {
      relativePath = contentInfo.path;
    }

    return relativePath.split("/").pop();
  }

  public static replaceName(path: string, newName: string): string {
    const contentInfo = GitHubUtils.fromContentUri(path);
    if (contentInfo) {
      const contentName = contentInfo.path.split("/").pop();
      if (!contentName) {
        throw new Error(`Failed to extract name from github path ${contentInfo.path}`);
      }

      const basePath = contentInfo.path.split(contentName).shift();
      return GitHubUtils.toContentUri(contentInfo.owner, contentInfo.repo, contentInfo.branch, `${basePath}${newName}`);
    }

    const contentName = path.split("/").pop();
    if (!contentName) {
      throw new Error(`Failed to extract name from path ${path}`);
    }

    const basePath = path.split(contentName).shift();
    return `${basePath}${newName}`;
  }

  public static findFirstCodeCellWithDisplay(notebookObject: ImmutableNotebook): number {
    let codeCellCount = -1;
    for (let i = 0; i < notebookObject.cellOrder.size; i++) {
      const cellId = notebookObject.cellOrder.get(i);
      const cell = notebookObject.cellMap.get(cellId);
      if (cell.cell_type === "code") {
        codeCellCount++;
        const codeCell = cell as ImmutableCodeCell;
        if (codeCell.outputs) {
          const displayOutput = codeCell.outputs.find((output: ImmutableOutput) => {
            if (output.output_type === "display_data" || output.output_type === "execute_result") {
              return true;
            }
            return false;
          });
          if (displayOutput) {
            return codeCellCount;
          }
        }
      }
    }

    throw new Error("Output does not exist for any of the cells.");
  }
}
