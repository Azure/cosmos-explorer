import path from "path";
import { ImmutableNotebook } from "@nteract/commutable";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";
import { StringUtils } from "../../Utils/StringUtils";

// Must match rx-jupyter' FileType
export type FileType = "directory" | "file" | "notebook";
// Utilities for notebooks
export class NotebookUtil {
  /**
   * It's a notebook file if the filename ends with .ipynb.
   */
  public static isNotebookFile(notebookPath: string): boolean {
    return StringUtils.endsWith(notebookPath, ".ipynb");
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

  public static getContentName(uri: string): string | undefined {
    const parts = uri.split("/");
    return parts.pop() || parts.pop(); // handle potential trailing slash
  }
}
