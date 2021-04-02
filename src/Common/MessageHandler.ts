import Q from "q";
import * as _ from "underscore";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { getDataExplorerWindow } from "../Utils/WindowUtils";
import * as Constants from "./Constants";

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
    id: _.uniqueId(),
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
    // We try to find data explorer window first, then fallback to current window
    const portalChildWindow = getDataExplorerWindow(window) || window;
    portalChildWindow.parent.postMessage(
      {
        signature: "pcIframe",
        data: data,
      },
      portalChildWindow.document.referrer || "*"
    );
  }
}

export function sendReadyMessage(): void {
  if (canSendMessage()) {
    // We try to find data explorer window first, then fallback to current window
    const portalChildWindow = getDataExplorerWindow(window) || window;
    portalChildWindow.parent.postMessage(
      {
        signature: "pcIframe",
        kind: "ready",
        data: "ready",
      },
      portalChildWindow.document.referrer || "*"
    );
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
