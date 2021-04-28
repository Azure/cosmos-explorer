import { Observable, of } from "rxjs";
import { AjaxRequest, AjaxResponse } from "rxjs/ajax";

let fakeAjaxResponse: AjaxResponse = {
  originalEvent: <Event>(<unknown>undefined),
  xhr: new XMLHttpRequest(),
  request: <AjaxRequest>(<unknown>null),
  status: 200,
  response: {},
  responseText: "",
  responseType: "json",
};
export const sessions = {
  create: (): Observable<AjaxResponse> => of(fakeAjaxResponse),
  __setResponse: (response: AjaxResponse) => {
    fakeAjaxResponse = response;
  },
  createSpy: undefined as any,
};
