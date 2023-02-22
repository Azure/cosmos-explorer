import Explorer from "Explorer/Explorer";
import { PortalMessage } from "hooks/useKnockoutExplorer";
import Q from "q";
import * as _ from "underscore";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { isInvalidParentFrameOrigin, shouldProcessMessage } from "../Utils/MessageValidation";
import { getDataExplorerWindow } from "../Utils/WindowUtils";
import * as Constants from "./Constants";

export interface CachedDataPromise<T> {
  deferred: Q.Deferred<T>;
  startTime: Date;
  id: string;
}

export const RequestMap: Record<string, CachedDataPromise<any>> = {};

export function addExplorerMessageHandlers(explorer: Explorer) {
  window.addEventListener(
    "message",
    (event) => {
      if (isInvalidParentFrameOrigin(event)) {
        return;
      }

      if (!shouldProcessMessage(event)) {
        return;
      }
      const message: PortalMessage = event.data?.data;
      const type = message?.type;
      switch (type) {
        case MessageTypes.RefreshResources:
          handleRefreshResources(message, explorer);
      }
    },
    false
  );
}

export function handleRefreshResources(message: any, explorer: Explorer): void {
  explorer.onRefreshResourcesClick();
}

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
  _sendMessage({
    signature: "pcIframe",
    data: data,
  });
}

export function sendReadyMessage(): void {
  _sendMessage({
    signature: "pcIframe",
    kind: "ready",
    data: "ready",
  });
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

const _sendMessage = (message: any): void => {
  if (canSendMessage()) {
    // Portal window can receive messages from only child windows
    const portalChildWindow = getDataExplorerWindow(window) || window;
    if (portalChildWindow === window) {
      // Current window is a child of portal, send message to portal window
      portalChildWindow.parent.postMessage(message, portalChildWindow.document.referrer || "*");
    } else {
      // Current window is not a child of portal, send message to the child window instead (which is data explorer)
      portalChildWindow.postMessage(message, portalChildWindow.location.origin || "*");
    }
  }
};
