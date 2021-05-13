import { FileType, IContent, IContentProvider, ServerConfig } from "@nteract/core";
import { Observable, of } from "rxjs";
import { AjaxResponse } from "rxjs/ajax";
import { HttpStatusCodes } from "../../../../Common/Constants";
import { getErrorMessage } from "../../../../Common/ErrorHandlingUtils";
import * as Logger from "../../../../Common/Logger";

export interface InMemoryContentProviderParams {
  [path: string]: { readonly: boolean; content: IContent<FileType> };
}

// Nteract relies on `errno` property to figure out the kind of failure
// That's why we need a custom wrapper around Error to include `errno` property
class InMemoryContentProviderError extends Error {
  constructor(error: string, public errno: number = InMemoryContentProvider.SelfErrorCode) {
    super(error);
  }
}

export class InMemoryContentProvider implements IContentProvider {
  public static readonly SelfErrorCode = 666;

  constructor(private params: InMemoryContentProviderParams) {}

  public remove(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "remove");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(_config: ServerConfig, uri: string): Observable<AjaxResponse> {
    const item = this.params[uri];
    if (item) {
      return of(this.createSuccessAjaxResponse(HttpStatusCodes.OK, item.content));
    }

    return this.errorResponse(`${uri} not found`, "get");
  }

  public update(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "update");
  }

  public create(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "create");
  }

  public save<FT extends FileType>(
    _config: ServerConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
    uri: string,
    model: Partial<IContent<FT>>
  ): Observable<AjaxResponse> {
    const item = this.params[uri];
    if (item) {
      if (!item.readonly) {
        Object.assign(item.content, model);
      }
      return of(this.createSuccessAjaxResponse(HttpStatusCodes.OK, item.content));
    }

    return this.errorResponse(`${uri} not found`, "save");
  }

  public listCheckpoints(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "listCheckpoints");
  }

  public createCheckpoint(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "createCheckpoint");
  }

  public deleteCheckpoint(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "deleteCheckpoint");
  }

  public restoreFromCheckpoint(): Observable<AjaxResponse> {
    return this.errorResponse("Not implemented", "restoreFromCheckpoint");
  }

  private errorResponse(message: string, functionName: string): Observable<AjaxResponse> {
    const error = new InMemoryContentProviderError(message);
    Logger.logError(error.message, `InMemoryContentProvider/${functionName}`, error.errno);
    return of(this.createErrorAjaxResponse(error));
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

  private createErrorAjaxResponse(error: InMemoryContentProviderError): AjaxResponse {
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
