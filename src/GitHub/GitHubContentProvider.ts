import { makeNotebookRecord, Notebook, stringifyNotebook, toJS } from "@nteract/commutable";
import { FileType, IContent, IContentProvider, IEmptyContent, IGetParams, ServerConfig } from "@nteract/core";
import { from, Observable, of } from "rxjs";
import { AjaxResponse } from "rxjs/ajax";
import { HttpStatusCodes } from "../Common/Constants";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import * as UrlUtility from "../Common/UrlUtility";
import { NotebookUtil } from "../Explorer/Notebook/NotebookUtil";
import * as Base64Utils from "../Utils/Base64Utils";
import * as GitHubUtils from "../Utils/GitHubUtils";
import { GitHubClient, IGitHubFile, IGitHubResponse } from "./GitHubClient";

export interface GitHubContentProviderParams {
  gitHubClient: GitHubClient;
  promptForCommitMsg: (title: string, primaryButtonLabel: string) => Promise<string>;
}

class GitHubContentProviderError extends Error {
  constructor(
    error: string,
    public errno: number = GitHubContentProvider.SelfErrorCode,
  ) {
    super(error);
  }
}

// Provides 'contents' API for GitHub
// http://jupyter-api.surge.sh/#!/contents
export class GitHubContentProvider implements IContentProvider {
  public static readonly SelfErrorCode = 555;

  constructor(private params: GitHubContentProviderParams) {}

  public remove(_: ServerConfig, uri: string): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          const commitMsg = await this.validateContentAndGetCommitMsg(content, "Delete", "Delete");
          const response = await this.params.gitHubClient.deleteFileAsync(content.data as IGitHubFile, commitMsg);
          if (response.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to delete", response.status);
          }

          return this.createSuccessAjaxResponse(HttpStatusCodes.NoContent, undefined);
        } catch (error) {
          Logger.logError(getErrorMessage(error), "GitHubContentProvider/remove", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      }),
    );
  }

  public get(_: ServerConfig, uri: string, params: Partial<IGetParams>): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          if (content.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get content", content.status);
          }

          if (!Array.isArray(content.data) && !content.data.content && params.content !== 0) {
            const file = content.data;
            file.content = (
              await this.params.gitHubClient.getBlobAsync(file.repo.owner, file.repo.name, file.sha)
            ).data;
          }

          return this.createSuccessAjaxResponse(HttpStatusCodes.OK, this.createContentModel(uri, content.data, params));
        } catch (error) {
          Logger.logError(getErrorMessage(error), "GitHubContentProvider/get", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      }),
    );
  }

  public update<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>>,
  ): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          const gitHubFile = content.data as IGitHubFile;
          const commitMsg = await this.validateContentAndGetCommitMsg(content, "Rename", "Rename");
          const newUri = model.path;
          const newPath = GitHubUtils.fromContentUri(newUri).path;
          const response = await this.params.gitHubClient.renameFileAsync(
            gitHubFile.repo.owner,
            gitHubFile.repo.name,
            gitHubFile.branch.name,
            commitMsg,
            gitHubFile.path,
            newPath,
          );
          if (response.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to rename", response.status);
          }

          gitHubFile.commit = response.data;
          gitHubFile.path = newPath;
          gitHubFile.name = NotebookUtil.getName(gitHubFile.path);

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.OK,
            this.createContentModel(newUri, gitHubFile, { content: 0 }),
          );
        } catch (error) {
          Logger.logError(getErrorMessage(error), "GitHubContentProvider/update", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      }),
    );
  }

  public create<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>> & { type: FT },
  ): Observable<AjaxResponse> {
    return from(
      this.params.promptForCommitMsg("Create New Notebook", "Create").then(async (commitMsg: string) => {
        try {
          if (!commitMsg) {
            throw new GitHubContentProviderError("Couldn't get a commit message");
          }

          if (model.type !== "notebook") {
            throw new GitHubContentProviderError("Unsupported content type");
          }

          const contentInfo = GitHubUtils.fromContentUri(uri);
          if (!contentInfo) {
            throw new GitHubContentProviderError(`Failed to parse ${uri}`);
          }

          const content = Base64Utils.utf8ToB64(stringifyNotebook(toJS(makeNotebookRecord())));
          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
          };
          const name = `Untitled-${new Date().toLocaleString("default", options)}.ipynb`;
          let path = name;
          if (contentInfo.path) {
            path = UrlUtility.createUri(contentInfo.path, name);
          }

          const response = await this.params.gitHubClient.createOrUpdateFileAsync(
            contentInfo.owner,
            contentInfo.repo,
            contentInfo.branch,
            path,
            commitMsg,
            content,
          );
          if (response.status !== HttpStatusCodes.Created) {
            throw new GitHubContentProviderError("Failed to create", response.status);
          }

          const newUri = GitHubUtils.toContentUri(contentInfo.owner, contentInfo.repo, contentInfo.branch, path);
          const newGitHubFile: IGitHubFile = {
            type: "blob",
            name: NotebookUtil.getName(newUri),
            path,
            repo: {
              owner: contentInfo.owner,
              name: contentInfo.repo,
              private: undefined,
            },
            branch: {
              name: contentInfo.branch,
            },
            commit: response.data,
          };

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.Created,
            this.createContentModel(newUri, newGitHubFile, { content: 0 }),
          );
        } catch (error) {
          Logger.logError(getErrorMessage(error), "GitHubContentProvider/create", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      }),
    );
  }

  public save<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>>,
  ): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          let commitMsg: string;
          if (content.status === HttpStatusCodes.NotFound) {
            // We'll create a new file since it doesn't exist
            commitMsg = await this.params.promptForCommitMsg("Save", "Save");
            if (!commitMsg) {
              throw new GitHubContentProviderError("Couldn't get a commit message");
            }
          } else {
            commitMsg = await this.validateContentAndGetCommitMsg(content, "Save", "Save");
          }

          let updatedContent: string;
          if (model.type === "notebook") {
            updatedContent = Base64Utils.utf8ToB64(stringifyNotebook(model.content as Notebook));
          } else if (model.type === "file") {
            updatedContent = model.content as string;
            if (model.format !== "base64") {
              updatedContent = Base64Utils.utf8ToB64(updatedContent);
            }
          } else {
            throw new GitHubContentProviderError("Unsupported content type");
          }

          const contentInfo = GitHubUtils.fromContentUri(uri);
          let gitHubFile: IGitHubFile;
          if (content.data) {
            gitHubFile = content.data as IGitHubFile;
          }

          const response = await this.params.gitHubClient.createOrUpdateFileAsync(
            contentInfo.owner,
            contentInfo.repo,
            contentInfo.branch,
            contentInfo.path,
            commitMsg,
            updatedContent,
            gitHubFile?.sha,
          );
          if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.Created) {
            throw new GitHubContentProviderError("Failed to create or update", response.status);
          }

          if (gitHubFile) {
            gitHubFile.commit = response.data;
          } else {
            const contentResponse = await this.params.gitHubClient.getContentsAsync(
              contentInfo.owner,
              contentInfo.repo,
              contentInfo.branch,
              contentInfo.path,
            );
            if (contentResponse.status !== HttpStatusCodes.OK) {
              throw new GitHubContentProviderError("Failed to get content", response.status);
            }

            gitHubFile = contentResponse.data as IGitHubFile;
          }

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.OK,
            this.createContentModel(uri, gitHubFile, { content: 0 }),
          );
        } catch (error) {
          Logger.logError(getErrorMessage(error), "GitHubContentProvider/update", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      }),
    );
  }

  public listCheckpoints(): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error.message, "GitHubContentProvider/listCheckpoints", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public createCheckpoint(): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error.message, "GitHubContentProvider/createCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public deleteCheckpoint(): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error.message, "GitHubContentProvider/deleteCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public restoreFromCheckpoint(): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error.message, "GitHubContentProvider/restoreFromCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  private async validateContentAndGetCommitMsg(
    content: IGitHubResponse<IGitHubFile | IGitHubFile[]>,
    promptTitle: string,
    promptPrimaryButtonLabel: string,
  ): Promise<string> {
    if (content.status !== HttpStatusCodes.OK) {
      throw new GitHubContentProviderError("Failed to get content", content.status);
    }

    if (Array.isArray(content.data)) {
      throw new GitHubContentProviderError("Operation not supported for collections");
    }

    const commitMsg = await this.params.promptForCommitMsg(promptTitle, promptPrimaryButtonLabel);
    if (!commitMsg) {
      throw new GitHubContentProviderError("Couldn't get a commit message");
    }

    return commitMsg;
  }

  private async getContent(uri: string): Promise<IGitHubResponse<IGitHubFile | IGitHubFile[]>> {
    const contentInfo = GitHubUtils.fromContentUri(uri);
    if (contentInfo) {
      const { owner, repo, branch, path } = contentInfo;
      return this.params.gitHubClient.getContentsAsync(owner, repo, branch, path);
    }

    return Promise.resolve({ status: GitHubContentProvider.SelfErrorCode, data: undefined });
  }

  private createContentModel(
    uri: string,
    content: IGitHubFile | IGitHubFile[],
    params: Partial<IGetParams>,
  ): IContent<FileType> {
    if (Array.isArray(content)) {
      return this.createDirectoryModel(uri, content);
    }

    if (content.type === "tree") {
      return this.createDirectoryModel(uri, undefined);
    }

    if (NotebookUtil.isNotebookFile(uri)) {
      return this.createNotebookModel(content, params);
    }

    return this.createFileModel(content, params);
  }

  private createDirectoryModel(uri: string, gitHubFiles: IGitHubFile[] | undefined): IContent<"directory"> {
    return {
      name: NotebookUtil.getName(uri),
      path: uri,
      type: "directory",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: "", // TODO: tamitta: we don't know this info here
      mimetype: undefined,
      content: gitHubFiles?.map(
        (file: IGitHubFile) =>
          this.createContentModel(
            GitHubUtils.toContentUri(file.repo.owner, file.repo.name, file.branch.name, file.path),
            file,
            {
              content: 0,
            },
          ) as IEmptyContent<FileType>,
      ),
      format: "json",
    };
  }

  private createNotebookModel(gitHubFile: IGitHubFile, params: Partial<IGetParams>): IContent<"notebook"> {
    const content: Notebook = gitHubFile.content && params.content !== 0 ? JSON.parse(gitHubFile.content) : undefined;
    return {
      name: gitHubFile.name,
      path: GitHubUtils.toContentUri(
        gitHubFile.repo.owner,
        gitHubFile.repo.name,
        gitHubFile.branch.name,
        gitHubFile.path,
      ),
      type: "notebook",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: gitHubFile.commit.commitDate,
      mimetype: content ? "application/x-ipynb+json" : undefined,
      content,
      format: content ? "json" : undefined,
    };
  }

  private createFileModel(gitHubFile: IGitHubFile, params: Partial<IGetParams>): IContent<"file"> {
    const content: string = gitHubFile.content && params.content !== 0 ? gitHubFile.content : undefined;
    return {
      name: gitHubFile.name,
      path: GitHubUtils.toContentUri(
        gitHubFile.repo.owner,
        gitHubFile.repo.name,
        gitHubFile.branch.name,
        gitHubFile.path,
      ),
      type: "file",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: gitHubFile.commit.commitDate,
      mimetype: content ? "text/plain" : undefined,
      content,
      format: content ? "text" : undefined,
    };
  }

  private createSuccessAjaxResponse(status: number, content: IContent<FileType>): AjaxResponse {
    return {
      originalEvent: new Event("no-op"),
      xhr: new XMLHttpRequest(),
      request: {},
      status,
      response: content ? content : undefined,
      responseText: content ? JSON.stringify(content) : undefined,
      responseType: "json",
    };
  }

  private createErrorAjaxResponse(error: GitHubContentProviderError): AjaxResponse {
    return {
      originalEvent: new Event("no-op"),
      xhr: new XMLHttpRequest(),
      request: {},
      status: error.errno,
      response: error,
      responseText: getErrorMessage(error),
      responseType: "json",
    };
  }
}
