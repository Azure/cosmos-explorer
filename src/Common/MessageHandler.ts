import { MessageTypes } from "../Contracts/ExplorerContracts";
import Q from "q";
import * as _ from "underscore";
import * as Constants from "./Constants";
import { getDataExplorerWindow } from "../Utils/WindowUtils";

export interface CachedDataPromise<T> {
  deferred: Q.Deferred<T>;
  startTime: Date;
  id: string;
}

export const RequestMap: Record<string, CachedDataPromise<any>> = {};

export function handleCachedDataMessage(message: any): void {
  const messageContent = message && message.message;
  if (message == null || messageContent == null || messageContent.id == null || !RequestMap[messageContent.id]) {
    return;
  }

  const cachedDataPromise = RequestMap[messageContent.id];
  if (messageContent.error != null) {
    cachedDataPromise.deferred.reject(messageContent.error);
  } else {
    cachedDataPromise.deferred.resolve(JSON.parse(messageContent.data));
  }
  runGarbageCollector();
}

export function sendCachedDataMessage<TResponseDataModel>(
  messageType: MessageTypes,
  params: Object[],
  timeoutInMs?: number
): Q.Promise<TResponseDataModel> {
  let cachedDataPromise: CachedDataPromise<TResponseDataModel> = {
    deferred: Q.defer<TResponseDataModel>(),
    startTime: new Date(),
    id: _.uniqueId()
  };
  RequestMap[cachedDataPromise.id] = cachedDataPromise;
  sendMessage({ type: messageType, params: params, id: cachedDataPromise.id });

  //TODO: Use telemetry to measure optimal time to resolve/reject promises
  return cachedDataPromise.deferred.promise.timeout(
    timeoutInMs || Constants.ClientDefaults.requestTimeoutMs,
    "Timed out while waiting for response from portal"
  );
}

export function sendMessage(data: any): void {
  if (canSendMessage()) {
    const dataExplorerWindow = getDataExplorerWindow(window);
    if (dataExplorerWindow) {
      dataExplorerWindow.parent.postMessage(
        {
          signature: "pcIframe",
          data: data
        },
        dataExplorerWindow.document.referrer
      );
    }
  }
}

export function canSendMessage(): boolean {
  return window.parent !== window;
}

// TODO: This is exported just for testing. It should not be.
export function runGarbageCollector() {
  Object.keys(RequestMap).forEach((key: string) => {
    const promise: Q.Promise<any> = RequestMap[key].deferred.promise;
    if (promise.isFulfilled() || promise.isRejected()) {
      delete RequestMap[key];
    }
  });
}
