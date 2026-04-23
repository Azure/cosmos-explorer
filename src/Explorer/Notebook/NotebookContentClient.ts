import { stringifyNotebook } from "@nteract/commutable";
import { FileType, IContent, IContentProvider, IEmptyContent, ServerConfig } from "@nteract/core";
import { cloneDeep } from "lodash";
import { AjaxResponse } from "rxjs/ajax";
import * as StringUtils from "../../Utils/StringUtils";
import * as FileSystemUtil from "./FileSystemUtil";
import { NotebookContentItem, NotebookContentItemType } from "./NotebookContentItem";
import { NotebookUtil } from "./NotebookUtil";
import { useNotebook } from "./useNotebook";

export class NotebookContentClient {
  constructor(private contentProvider: IContentProvider) {}

  /**
   * This updates the item and points all the children's parent to this item
   * @param item
   */
  public async updateItemChildren(item: NotebookContentItem): Promise<NotebookContentItem> {
    const subItems = await this.fetchNotebookFiles(item.path);
    const clonedItem = cloneDeep(item);
    subItems.forEach((subItem) => (subItem.parent = clonedItem));
    clonedItem.children = subItems;

    return clonedItem;
  }

  // TODO: Delete this function when ResourceTreeAdapter is removed.
  public async updateItemChildrenInPlace(item: NotebookContentItem): Promise<void> {
    return this.fetchNotebookFiles(item.path).then((subItems) => {
      item.children = subItems;
      subItems.forEach((subItem) => (subItem.parent = item));
    });
  }

  /**
   *
   * @param parent parent folder
   */
  public async createNewNotebookFile(
    parent: NotebookContentItem,
    isGithubTree?: boolean,
  ): Promise<NotebookContentItem> {
    if (!parent || parent.type !== NotebookContentItemType.Directory) {
      throw new Error(`Parent must be a directory: ${parent}`);
    }

    const type = "notebook";
    return this.contentProvider
      .create<"notebook">(this.getServerConfig(), parent.path, { type })
      .toPromise()
      .then((xhr: AjaxResponse) => {
        if (typeof xhr.response === "string") {
          throw new Error(`jupyter server response invalid: ${xhr.response}`);
        }

        if (xhr.response.type !== type) {
          throw new Error(`jupyter server response not for notebook: ${xhr.response}`);
        }

        const notebookFile = xhr.response;

        const item = NotebookUtil.createNotebookContentItem(notebookFile.name, notebookFile.path, notebookFile.type);
        useNotebook.getState().insertNotebookItem(parent, cloneDeep(item), isGithubTree);
        // TODO: delete when ResourceTreeAdapter is removed
        if (parent.children) {
          item.parent = parent;
          parent.children.push(item);
        }

        return item;
      });
  }

  public async deleteContentItem(item: NotebookContentItem, isGithubTree?: boolean): Promise<void> {
    const path = await this.deleteNotebookFile(item.path);
    useNotebook.getState().deleteNotebookItem(item, isGithubTree);

    // TODO: Delete once old resource tree is removed
    if (!path || path !== item.path) {
      throw new Error("No path provided");
    }

    if (item.parent && item.parent.children) {
      // Remove deleted child
      const newChildren = item.parent.children.filter((child) => child.path !== path);
      item.parent.children = newChildren;
    }
  }

  /**
   *
   * @param name file name
   * @param content file content string
   * @param parent parent folder
   */
  public async uploadFileAsync(
    name: string,
    content: string,
    parent: NotebookContentItem,
    isGithubTree?: boolean,
  ): Promise<NotebookContentItem> {
    if (!parent || parent.type !== NotebookContentItemType.Directory) {
      throw new Error(`Parent must be a directory: ${parent}`);
    }
    const filepath = NotebookUtil.getFilePath(parent.path, name);
    if (await this.checkIfFilepathExists(filepath)) {
      throw new Error(`File already exists: ${filepath}`);
    }

    const model: Partial<IContent<"file">> = {
      content,
      format: "text",
      name,
      type: "file",
    };

    return this.contentProvider
      .save(this.getServerConfig(), filepath, model)
      .toPromise()
      .then((xhr: AjaxResponse) => {
        const notebookFile = xhr.response;
        const item = NotebookUtil.createNotebookContentItem(notebookFile.name, notebookFile.path, notebookFile.type);
        useNotebook.getState().insertNotebookItem(parent, cloneDeep(item), isGithubTree);
        // TODO: delete when ResourceTreeAdapter is removed
        if (parent.children) {
          item.parent = parent;
          parent.children.push(item);
        }
        return item;
      });
  }

  private async checkIfFilepathExists(filepath: string): Promise<boolean> {
    const parentDirPath = NotebookUtil.getParentPath(filepath);
    if (parentDirPath) {
      const items = await this.fetchNotebookFiles(parentDirPath);
      return items.some((value) => FileSystemUtil.isPathEqual(value.path, filepath));
    }
    return false;
  }

  /**
   *
   * @param sourcePath
   * @param targetName is not prefixed with path
   */
  public renameNotebook(
    item: NotebookContentItem,
    targetName: string,
    isGithubTree?: boolean,
  ): Promise<NotebookContentItem> {
    const sourcePath = item.path;
    // Match extension
    if (sourcePath.indexOf(".") !== -1) {
      const extension = `.${sourcePath.split(".").pop()}`;
      if (!StringUtils.endsWith(targetName, extension)) {
        targetName += extension;
      }
    }
    const targetPath = NotebookUtil.replaceName(sourcePath, targetName);
    return this.contentProvider
      .update<"file" | "notebook" | "directory">(this.getServerConfig(), sourcePath, { path: targetPath })
      .toPromise()
      .then((xhr) => {
        if (typeof xhr.response === "string") {
          throw new Error(`jupyter server response invalid: ${xhr.response}`);
        }

        if (xhr.response.type !== "file" && xhr.response.type !== "notebook" && xhr.response.type !== "directory") {
          throw new Error(`jupyter server response not for notebook/file/directory: ${xhr.response}`);
        }

        const notebookFile = xhr.response;
        item.name = notebookFile.name;
        item.path = notebookFile.path;
        item.timestamp = NotebookUtil.getCurrentTimestamp();

        useNotebook.getState().updateNotebookItem(item, isGithubTree);

        return item;
      });
  }

  /**
   *
   * @param parent
   * @param newDirectoryName basename of the new directory
   */
  public async createDirectory(
    parent: NotebookContentItem,
    newDirectoryName: string,
    isGithubTree?: boolean,
  ): Promise<NotebookContentItem> {
    if (parent.type !== NotebookContentItemType.Directory) {
      throw new Error(`Parent is not a directory: ${parent.path}`);
    }

    const targetPath = `${parent.path}/${newDirectoryName}`;

    // Reject if already exists
    if (await this.checkIfFilepathExists(targetPath)) {
      throw new Error(`Directory already exists: ${targetPath}`);
    }

    const type = "directory";
    return this.contentProvider
      .save<"directory">(this.getServerConfig(), targetPath, { type, path: targetPath })
      .toPromise()
      .then((xhr: AjaxResponse) => {
        if (typeof xhr.response === "string") {
          throw new Error(`jupyter server response invalid: ${xhr.response}`);
        }

        if (xhr.response.type !== type) {
          throw new Error(`jupyter server response not for creating directory: ${xhr.response}`);
        }

        const dir = xhr.response;
        const item = NotebookUtil.createNotebookContentItem(dir.name, dir.path, dir.type);
        useNotebook.getState().insertNotebookItem(parent, cloneDeep(item), isGithubTree);
        // TODO: delete when ResourceTreeAdapter is removed
        item.parent = parent;
        parent.children?.push(item);

        return item;
      });
  }

  public async readFileContent(filePath: string): Promise<string> {
    const xhr = await this.contentProvider.get(this.getServerConfig(), filePath, { content: 1 }).toPromise();
    //eslint-disable-next-line
    const content = (xhr.response as any).content;
    if (!content) {
      throw new Error("No content read");
    }
    //eslint-disable-next-line
    const format = (xhr.response as any).format;
    switch (format) {
      case "text":
        return content;
      case "base64":
        return atob(content);
      case "json":
        return stringifyNotebook(content);
      default:
        throw new Error(`Unsupported content format ${format}`);
    }
  }

  private deleteNotebookFile(path: string): Promise<string> {
    return this.contentProvider
      .remove(this.getServerConfig(), path)
      .toPromise()
      .then(() => path);
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

  private fetchNotebookFiles(path: string): Promise<NotebookContentItem[]> {
    return this.contentProvider
      .get(this.getServerConfig(), path, {
        type: "directory",
      })
      .toPromise()
      .then((xhr) => {
        if (xhr.status !== 200) {
          throw new Error(JSON.stringify(xhr.response));
        }

        if (typeof xhr.response === "string") {
          throw new Error(`jupyter server response invalid: ${xhr.response}`);
        }

        if (xhr.response.type !== "directory") {
          throw new Error(`jupyter server response not for directory: ${xhr.response}`);
        }

        const list = xhr.response.content as IEmptyContent<FileType>[];
        return list.map(
          (item: IEmptyContent<FileType>): NotebookContentItem => ({
            name: item.name,
            path: item.path,
            type: NotebookUtil.getType(item.type),
          }),
        );
      });
  }

  private getServerConfig(): ServerConfig {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    return {
      endpoint: notebookServerInfo?.notebookServerEndpoint,
      token: notebookServerInfo?.authToken,
      crossDomain: true,
    };
  }
}
