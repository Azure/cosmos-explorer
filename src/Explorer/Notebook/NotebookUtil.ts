import * as StringUtils from "../../Utils/StringUtils";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";

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
      timestamp: NotebookUtil.getCurrentTimestamp(),
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

  public static getFilePath(path: string, fileName: string): string {
    return `${path}/${fileName}`;
  }

  public static getParentPath(filepath: string): undefined | string {
    const basename = NotebookUtil.getName(filepath);
    if (basename) {
      const parentPath = filepath.split(basename).shift();
      if (parentPath) {
        return parentPath.replace(/\/$/, ""); // no trailling slash
      }
    }

    return undefined;
  }

  public static getName(path: string): undefined | string {
    return path.split("/").pop();
  }

  public static replaceName(path: string, newName: string): string {
    const contentName = path.split("/").pop();
    if (!contentName) {
      throw new Error(`Failed to extract name from path ${path}`);
    }

    const basePath = path.split(contentName).shift();
    return `${basePath}${newName}`;
  }
}
