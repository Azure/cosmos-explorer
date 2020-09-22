import { MessageTypes } from "../Contracts/ExplorerContracts";
import Q from "q";
import * as _ from "underscore";
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

// Only exported for unit tests
export const getDataExplorerWindow = (currentWindow: Window): Window | undefined => {
  // Start with the current window and traverse up the parent hierarchy to find a window
  // with `dataExplorerPlatform` property
  let dataExplorerWindow: Window | undefined = currentWindow;
  // TODO: Need to `any` here since the window imports Explorer which can't be in strict mode yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  while (dataExplorerWindow && (dataExplorerWindow as any).dataExplorerPlatform == undefined) {
    // If a window does not have a parent, its parent property is a reference to itself.
    if (dataExplorerWindow.parent == dataExplorerWindow) {
      dataExplorerWindow = undefined;
    } else {
      dataExplorerWindow = dataExplorerWindow.parent;
    }
  }

  return dataExplorerWindow;
};

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
