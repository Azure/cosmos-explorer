import { Notebook, stringifyNotebook, makeNotebookRecord, toJS } from "@nteract/commutable";
import { FileType, IContent, IContentProvider, IEmptyContent, IGetParams, ServerConfig } from "@nteract/core";
import { from, Observable, of } from "rxjs";
import { AjaxResponse } from "rxjs/ajax";
import { HttpStatusCodes } from "../Common/Constants";
import { Logger } from "../Common/Logger";
import { NotebookUtil } from "../Explorer/Notebook/NotebookUtil";
import { GitHubClient, IGitHubFile, IGitHubResponse, IGitHubCommit } from "./GitHubClient";
import { GitHubUtils } from "../Utils/GitHubUtils";
import UrlUtility from "../Common/UrlUtility";

export interface GitHubContentProviderParams {
  gitHubClient: GitHubClient;
  promptForCommitMsg: (title: string, primaryButtonLabel: string) => Promise<string>;
}

class GitHubContentProviderError extends Error {
  constructor(error: string, public errno: number = GitHubContentProvider.SelfErrorCode) {
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
          Logger.logError(error, "GitHubContentProvider/remove", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      })
    );
  }

  public get(_: ServerConfig, uri: string, params: Partial<IGetParams>): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          if (content.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get content", content.status);
          }

          const contentInfo = GitHubUtils.fromContentUri(uri);
          const commitResponse = await this.params.gitHubClient.getCommitsAsync(
            contentInfo.owner,
            contentInfo.repo,
            contentInfo.branch,
            contentInfo.path,
            1,
            1
          );
          if (commitResponse.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get commit", commitResponse.status);
          }

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.OK,
            this.createContentModel(uri, content.data, commitResponse.data[0], params)
          );
        } catch (error) {
          Logger.logError(error, "GitHubContentProvider/get", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      })
    );
  }

  public update<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>>
  ): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          const gitHubFile = content.data as IGitHubFile;
          const commitMsg = await this.validateContentAndGetCommitMsg(content, "Rename", "Rename");
          const newUri = model.path;
          const response = await this.params.gitHubClient.renameFileAsync(
            gitHubFile.repo.owner.login,
            gitHubFile.repo.name,
            gitHubFile.branch.name,
            commitMsg,
            gitHubFile.path,
            GitHubUtils.fromContentUri(newUri).path
          );
          if (response.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to rename", response.status);
          }

          const updatedContentResponse = await this.getContent(model.path);
          if (updatedContentResponse.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get content after renaming", updatedContentResponse.status);
          }

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.OK,
            this.createContentModel(newUri, updatedContentResponse.data, response.data, { content: 0 })
          );
        } catch (error) {
          Logger.logError(error, "GitHubContentProvider/update", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      })
    );
  }

  public create<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>> & { type: FT }
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

          const content = btoa(stringifyNotebook(toJS(makeNotebookRecord())));
          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
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
            content
          );
          if (response.status !== HttpStatusCodes.Created) {
            throw new GitHubContentProviderError("Failed to create", response.status);
          }

          const newUri = GitHubUtils.toContentUri(contentInfo.owner, contentInfo.repo, contentInfo.branch, path);
          const newContentResponse = await this.getContent(newUri);
          if (newContentResponse.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get content after creating", newContentResponse.status);
          }

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.Created,
            this.createContentModel(newUri, newContentResponse.data, response.data, { content: 0 })
          );
        } catch (error) {
          Logger.logError(error, "GitHubContentProvider/create", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      })
    );
  }

  public save<FT extends FileType>(
    _: ServerConfig,
    uri: string,
    model: Partial<IContent<FT>>
  ): Observable<AjaxResponse> {
    return from(
      this.getContent(uri).then(async (content: IGitHubResponse<IGitHubFile | IGitHubFile[]>) => {
        try {
          const commitMsg = await this.validateContentAndGetCommitMsg(content, "Save", "Save");
          let updatedContent: string;
          if (model.type === "notebook") {
            updatedContent = btoa(stringifyNotebook(model.content as Notebook));
          } else if (model.type === "file") {
            updatedContent = model.content as string;
            if (model.format !== "base64") {
              updatedContent = btoa(updatedContent);
            }
          } else {
            throw new GitHubContentProviderError("Unsupported content type");
          }

          const gitHubFile = content.data as IGitHubFile;
          const response = await this.params.gitHubClient.createOrUpdateFileAsync(
            gitHubFile.repo.owner.login,
            gitHubFile.repo.name,
            gitHubFile.branch.name,
            gitHubFile.path,
            commitMsg,
            updatedContent,
            gitHubFile.sha
          );
          if (response.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to update", response.status);
          }

          const savedContentResponse = await this.getContent(uri);
          if (savedContentResponse.status !== HttpStatusCodes.OK) {
            throw new GitHubContentProviderError("Failed to get content after updating", savedContentResponse.status);
          }

          return this.createSuccessAjaxResponse(
            HttpStatusCodes.OK,
            this.createContentModel(uri, savedContentResponse.data, response.data, { content: 0 })
          );
        } catch (error) {
          Logger.logError(error, "GitHubContentProvider/update", error.errno);
          return this.createErrorAjaxResponse(error);
        }
      })
    );
  }

  public listCheckpoints(_: ServerConfig, path: string): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error, "GitHubContentProvider/listCheckpoints", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public createCheckpoint(_: ServerConfig, path: string): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error, "GitHubContentProvider/createCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public deleteCheckpoint(_: ServerConfig, path: string, checkpointID: string): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error, "GitHubContentProvider/deleteCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  public restoreFromCheckpoint(_: ServerConfig, path: string, checkpointID: string): Observable<AjaxResponse> {
    const error = new GitHubContentProviderError("Not implemented");
    Logger.logError(error, "GitHubContentProvider/restoreFromCheckpoint", error.errno);
    return of(this.createErrorAjaxResponse(error));
  }

  private async validateContentAndGetCommitMsg(
    content: IGitHubResponse<IGitHubFile | IGitHubFile[]>,
    promptTitle: string,
    promptPrimaryButtonLabel: string
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

  private getContent(uri: string): Promise<IGitHubResponse<IGitHubFile | IGitHubFile[]>> {
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
    commit: IGitHubCommit,
    params: Partial<IGetParams>
  ): IContent<FileType> {
    if (Array.isArray(content)) {
      return this.createDirectoryModel(uri, content, commit);
    }

    if (content.type !== "file") {
      return this.createDirectoryModel(uri, undefined, commit);
    }

    if (NotebookUtil.isNotebookFile(uri)) {
      return this.createNotebookModel(content, commit, params);
    }

    return this.createFileModel(content, commit, params);
  }

  private createDirectoryModel(
    uri: string,
    gitHubFiles: IGitHubFile[] | undefined,
    commit: IGitHubCommit
  ): IContent<"directory"> {
    return {
      name: GitHubUtils.fromContentUri(uri).path,
      path: uri,
      type: "directory",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: commit.committer.date,
      mimetype: undefined,
      content: gitHubFiles?.map(
        (file: IGitHubFile) =>
          this.createContentModel(
            GitHubUtils.toContentUri(file.repo.owner.login, file.repo.name, file.branch.name, file.path),
            file,
            commit,
            {
              content: 0
            }
          ) as IEmptyContent<FileType>
      ),
      format: "json"
    };
  }

  private createNotebookModel(
    gitHubFile: IGitHubFile,
    commit: IGitHubCommit,
    params: Partial<IGetParams>
  ): IContent<"notebook"> {
    const content: Notebook =
      gitHubFile.content && params.content !== 0 ? JSON.parse(atob(gitHubFile.content)) : undefined;
    return {
      name: gitHubFile.name,
      path: GitHubUtils.toContentUri(
        gitHubFile.repo.owner.login,
        gitHubFile.repo.name,
        gitHubFile.branch.name,
        gitHubFile.path
      ),
      type: "notebook",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: commit.committer.date,
      mimetype: content ? "application/x-ipynb+json" : undefined,
      content,
      format: content ? "json" : undefined
    };
  }

  private createFileModel(
    gitHubFile: IGitHubFile,
    commit: IGitHubCommit,
    params: Partial<IGetParams>
  ): IContent<"file"> {
    const content: string = gitHubFile.content && params.content !== 0 ? atob(gitHubFile.content) : undefined;
    return {
      name: gitHubFile.name,
      path: GitHubUtils.toContentUri(
        gitHubFile.repo.owner.login,
        gitHubFile.repo.name,
        gitHubFile.branch.name,
        gitHubFile.path
      ),
      type: "file",
      writable: true, // TODO: tamitta: we don't know this info here
      created: "", // TODO: tamitta: we don't know this info here
      last_modified: commit.committer.date,
      mimetype: content ? "text/plain" : undefined,
      content,
      format: content ? "text" : undefined
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
      responseType: "json"
    };
  }

  private createErrorAjaxResponse(error: GitHubContentProviderError): AjaxResponse {
    return {
      originalEvent: new Event("no-op"),
      xhr: new XMLHttpRequest(),
      request: {},
      status: error.errno,
      response: error,
      responseText: JSON.stringify(error),
      responseType: "json"
    };
  }
}
