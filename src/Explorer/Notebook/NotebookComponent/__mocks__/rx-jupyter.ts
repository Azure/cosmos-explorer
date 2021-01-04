import { Observable, of } from "rxjs";
import { AjaxResponse } from "rxjs/ajax";
import { ServerConfig } from "@nteract/types";

let fakeAjaxResponse: AjaxResponse = {
  originalEvent: undefined,
  xhr: new XMLHttpRequest(),
  request: null,
  status: 200,
  response: {},
  responseText: null,
  responseType: "json"
};
export const sessions = {
  create: (serverConfig: ServerConfig, body: object): Observable<AjaxResponse> => of(fakeAjaxResponse),
  __setResponse: (response: AjaxResponse) => {
    fakeAjaxResponse = response;
  },
  createSpy: undefined as any
};
