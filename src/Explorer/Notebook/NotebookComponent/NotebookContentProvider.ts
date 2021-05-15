import { FileType, IContent, IContentProvider, IGetParams, ServerConfig } from "@nteract/core";
import { Observable } from "rxjs";
import { AjaxResponse } from "rxjs/ajax";
import { GitHubContentProvider } from "../../../GitHub/GitHubContentProvider";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import { InMemoryContentProvider } from "./ContentProviders/InMemoryContentProvider";
import * as InMemoryContentProviderUtils from "./ContentProviders/InMemoryContentProviderUtils";

export class NotebookContentProvider implements IContentProvider {
  constructor(
    private inMemoryContentProvider: InMemoryContentProvider,
    private gitHubContentProvider: GitHubContentProvider,
    private jupyterContentProvider: IContentProvider
  ) {}

  public remove(serverConfig: ServerConfig, path: string): Observable<AjaxResponse> {
    return this.getContentProvider(path).remove(serverConfig, path);
  }

  public get(serverConfig: ServerConfig, path: string, params: Partial<IGetParams>): Observable<AjaxResponse> {
    return this.getContentProvider(path).get(serverConfig, path, params);
  }

  public update<FT extends FileType>(
    serverConfig: ServerConfig,
    path: string,
    model: Partial<IContent<FT>>
  ): Observable<AjaxResponse> {
    return this.getContentProvider(path).update(serverConfig, path, model);
  }

  public create<FT extends FileType>(
    serverConfig: ServerConfig,
    path: string,
    model: Partial<IContent<FT>> & { type: FT }
  ): Observable<AjaxResponse> {
    return this.getContentProvider(path).create(serverConfig, path, model);
  }

  public save<FT extends FileType>(
    serverConfig: ServerConfig,
    path: string,
    model: Partial<IContent<FT>>
  ): Observable<AjaxResponse> {
    return this.getContentProvider(path).save(serverConfig, path, model);
  }

  public listCheckpoints(serverConfig: ServerConfig, path: string): Observable<AjaxResponse> {
    return this.getContentProvider(path).listCheckpoints(serverConfig, path);
  }

  public createCheckpoint(serverConfig: ServerConfig, path: string): Observable<AjaxResponse> {
    return this.getContentProvider(path).createCheckpoint(serverConfig, path);
  }

  public deleteCheckpoint(serverConfig: ServerConfig, path: string, checkpointID: string): Observable<AjaxResponse> {
    return this.getContentProvider(path).deleteCheckpoint(serverConfig, path, checkpointID);
  }

  public restoreFromCheckpoint(
    serverConfig: ServerConfig,
    path: string,
    checkpointID: string
  ): Observable<AjaxResponse> {
    return this.getContentProvider(path).restoreFromCheckpoint(serverConfig, path, checkpointID);
  }

  private getContentProvider(path: string): IContentProvider {
    if (InMemoryContentProviderUtils.fromContentUri(path)) {
      return this.inMemoryContentProvider;
    }

    if (GitHubUtils.fromContentUri(path)) {
      return this.gitHubContentProvider;
    }

    return this.jupyterContentProvider;
  }
}
