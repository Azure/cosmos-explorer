import { ImmutableCodeCell, ImmutableNotebook } from "@nteract/commutable";
import Html2Canvas from "html2canvas";
import path from "path";
import * as GitHubUtils from "../../Utils/GitHubUtils";
import * as StringUtils from "../../Utils/StringUtils";
import { SnapshotFragment } from "./NotebookComponent/types";
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
      kernelSpecName,
    };
  }

  public static getFilePath(path: string, fileName: string): string {
    const contentInfo = GitHubUtils.fromContentUri(path);
    if (contentInfo) {
      let path = fileName;
      if (contentInfo.path) {
        path = `${contentInfo.path}/${path}`;
      }
      return GitHubUtils.toContentUri(contentInfo.owner, contentInfo.repo, contentInfo.branch, path);
    }

    return `${path}/${fileName}`;
  }

  public static getParentPath(filepath: string): undefined | string {
    const basename = NotebookUtil.getName(filepath);
    if (basename) {
      const contentInfo = GitHubUtils.fromContentUri(filepath);
      if (contentInfo) {
        const parentPath = contentInfo.path.split(basename).shift();
        if (parentPath === undefined) {
          return undefined;
        }

        return GitHubUtils.toContentUri(
          contentInfo.owner,
          contentInfo.repo,
          contentInfo.branch,
          parentPath.replace(/\/$/, "") // no trailling slash
        );
      }

      const parentPath = filepath.split(basename).shift();
      if (parentPath) {
        return parentPath.replace(/\/$/, ""); // no trailling slash
      }
    }

    return undefined;
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

  public static findFirstCodeCellWithDisplay(notebookObject: ImmutableNotebook): string {
    for (let i = 0; i < notebookObject.cellOrder.size; i++) {
      const cellId = notebookObject.cellOrder.get(i);
      if (cellId) {
        const cell = notebookObject.cellMap.get(cellId);
        if (cell?.cell_type === "code") {
          const displayOutput = (cell as ImmutableCodeCell)?.outputs?.find(
            (output) => output.output_type === "display_data" || output.output_type === "execute_result"
          );
          if (displayOutput) {
            return cellId;
          }
        }
      }
    }
    throw new Error("Output does not exist for any of the cells.");
  }

  public static takeScreenshot = (
    target: HTMLElement,
    aspectRatio: number,
    subSnaphosts: SnapshotFragment[],
    onSuccess: (imageSrc: string, image: HTMLImageElement) => void,
    onError: (error: Error) => void,
    downloadFile?: boolean
  ): void => {
    target.scrollIntoView();
    Html2Canvas(target, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: true,
    })
      .then((canvas) => {
        //redraw canvas to fit aspect ratio
        const originalImageData = canvas.toDataURL();
        const width = parseInt(canvas.style.width.split("px")[0]);
        if (aspectRatio) {
          canvas.height = width * aspectRatio;
        }

        if (originalImageData === "data:,") {
          // Empty output
          onSuccess(undefined, undefined);
          return;
        }

        const context = canvas.getContext("2d");
        const image = new Image();
        image.src = originalImageData;
        console.log(canvas);
        image.onload = () => {
          context.drawImage(image, 0, 0);

          // draw sub images
          if (subSnaphosts) {
            const parentRect = target.getBoundingClientRect();
            subSnaphosts.forEach((snapshot) => {
              if (snapshot.image) {
                context.drawImage(
                  snapshot.image,
                  snapshot.boundingClientRect.x - parentRect.x,
                  snapshot.boundingClientRect.y - parentRect.y
                );
              }
            });
          }

          onSuccess(canvas.toDataURL(), image);

          if (downloadFile) {
            const image2 = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you dont replace you will get a DOM 18 exception.
            window.location.href = image2; // it will save locally
          }
        };
      })
      .catch((error) => {
        onError(error);
      });
  };
}
