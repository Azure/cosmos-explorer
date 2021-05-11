import { ImmutableCodeCell, ImmutableNotebook } from "@nteract/commutable";
import domtoimage from "dom-to-image";
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

  public static hasCodeCellOutput(cell: ImmutableCodeCell): boolean {
    return !!cell?.outputs?.find(
      (output) =>
        output.output_type === "display_data" ||
        output.output_type === "execute_result" ||
        output.output_type === "stream"
    );
  }

  /**
   * Find code cells with display
   * @param notebookObject
   * @returns array of cell ids
   */
  public static findCodeCellWithDisplay(notebookObject: ImmutableNotebook): string[] {
    return notebookObject.cellOrder.reduce((accumulator: string[], cellId) => {
      const cell = notebookObject.cellMap.get(cellId);
      if (cell?.cell_type === "code") {
        if (NotebookUtil.hasCodeCellOutput(cell as ImmutableCodeCell)) {
          accumulator.push(cellId);
        }
      }
      return accumulator;
    }, []);
  }

  public static takeScreenshotHtml2Canvas = (
    target: HTMLElement,
    aspectRatio: number,
    subSnapshots: SnapshotFragment[],
    downloadFilename?: string
  ): Promise<{ imageSrc: string | undefined }> => {
    return new Promise(async (resolve, reject) => {
      try {
        // target.scrollIntoView();
        const canvas = await Html2Canvas(target, {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          logging: false,
        });

        //redraw canvas to fit aspect ratio
        const originalImageData = canvas.toDataURL();
        const width = parseInt(canvas.style.width.split("px")[0]);
        if (aspectRatio) {
          canvas.height = width * aspectRatio;
        }

        if (originalImageData === "data:,") {
          // Empty output
          resolve({ imageSrc: undefined });
          return;
        }

        const context = canvas.getContext("2d");
        const image = new Image();
        image.src = originalImageData;
        image.onload = () => {
          if (!context) {
            reject(new Error("No context to draw on"));
            return;
          }
          context.drawImage(image, 0, 0);

          // draw sub images
          if (subSnapshots) {
            const parentRect = target.getBoundingClientRect();
            subSnapshots.forEach((snapshot) => {
              if (snapshot.image) {
                context.drawImage(
                  snapshot.image,
                  snapshot.boundingClientRect.x - parentRect.x,
                  snapshot.boundingClientRect.y - parentRect.y
                );
              }
            });
          }

          resolve({ imageSrc: canvas.toDataURL() });

          if (downloadFilename) {
            NotebookUtil.downloadFile(
              downloadFilename,
              canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
            );
          }
        };
      } catch (error) {
        return reject(error);
      }
    });
  };

  public static takeScreenshotDomToImage = (
    target: HTMLElement,
    aspectRatio: number,
    subSnapshots: SnapshotFragment[],
    downloadFilename?: string
  ): Promise<{ imageSrc?: string }> => {
    return new Promise(async (resolve, reject) => {
      // target.scrollIntoView();
      try {
        const filter = (node: Node): boolean => {
          const excludedList = ["IMG", "CANVAS"];
          return !excludedList.includes((node as HTMLElement).tagName);
        };

        const originalImageData = await domtoimage.toPng(target, { filter });
        if (originalImageData === "data:,") {
          // Empty output
          resolve({});
          return;
        }

        const baseImage = new Image();
        baseImage.src = originalImageData;
        baseImage.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = baseImage.width;
          canvas.height = aspectRatio !== undefined ? baseImage.width * aspectRatio : baseImage.width;

          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("No Canvas to draw on"));
            return;
          }

          // White background otherwise image is transparent
          context.fillStyle = "white";
          context.fillRect(0, 0, baseImage.width, baseImage.height);

          context.drawImage(baseImage, 0, 0);

          // draw sub images
          if (subSnapshots) {
            const parentRect = target.getBoundingClientRect();
            subSnapshots.forEach((snapshot) => {
              if (snapshot.image) {
                context.drawImage(
                  snapshot.image,
                  snapshot.boundingClientRect.x - parentRect.x,
                  snapshot.boundingClientRect.y - parentRect.y
                );
              }
            });
          }

          resolve({ imageSrc: canvas.toDataURL() });

          if (downloadFilename) {
            NotebookUtil.downloadFile(
              downloadFilename,
              canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
            );
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  private static downloadFile(filename: string, content: string): void {
    const link = document.createElement("a");
    link.href = content;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
