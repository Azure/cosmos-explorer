import { SeverityLevel } from "@microsoft/applicationinsights-web";
import { FabricMessageTypes } from "Contracts/FabricMessageTypes";
import Q from "q";
import * as _ from "underscore";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { trackTrace } from "../Shared/appInsights";
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
    cachedDataPromise.deferred.resolve(messageContent.data);
  }
  runGarbageCollector();
}

/**
 *
 * @param messageType
 * @param params
 * @param scope Use this string to identify request Useful to distinguish response from different senders
 * @param timeoutInMs
 * @returns
 */
export function sendCachedDataMessage<TResponseDataModel>(
  messageType: MessageTypes | FabricMessageTypes,
  params: Object[],
  scope?: string,
  timeoutInMs?: number,
): Q.Promise<TResponseDataModel> {
  let cachedDataPromise: CachedDataPromise<TResponseDataModel> = {
    deferred: Q.defer<TResponseDataModel>(),
    startTime: new Date(),
    id: _.uniqueId(scope),
  };
  RequestMap[cachedDataPromise.id] = cachedDataPromise;
  sendMessage({ type: messageType, params: params, id: cachedDataPromise.id });

  //TODO: Use telemetry to measure optimal time to resolve/reject promises
  return cachedDataPromise.deferred.promise.timeout(
    timeoutInMs || Constants.ClientDefaults.requestTimeoutMs,
    "Timed out while waiting for response from portal",
  );
}

/**
 *
 * @param data Overwrite the data property of the message
 */
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
      const portalTargetOrigin = _getPortalTargetOrigin(portalChildWindow);
      if (portalTargetOrigin) {
        portalChildWindow.parent.postMessage(message, portalTargetOrigin);
      } else {
        _reportPostMessageFailure("Iframe failed to send message to portal: no target origin");
      }
    } else {
      // Current window is not a child of portal, send message to the child window instead (which is data explorer)
      if (portalChildWindow.location.origin) {
        portalChildWindow.postMessage(message, portalChildWindow.location.origin);
      } else {
        _reportPostMessageFailure("Iframe failed to send message to data explorer: no origin");
      }
    }
  }
};

/**
 * Reports a postMessage failure to telemetry without routing through Logger.logError.
 *
 * IMPORTANT: Logger.logError calls sendMessage, which re-enters _sendMessage. If the
 * failure here is itself "no target origin", that would cause infinite recursion
 * ("too much recursion"). We call trackTrace directly so telemetry is preserved
 * without triggering the recursive postMessage path.
 */
const _reportPostMessageFailure = (errorMessage: string): void => {
  try {
    trackTrace({ message: errorMessage, severityLevel: SeverityLevel.Error }, { area: "MessageHandler" });
  } catch {
    // Telemetry should never throw, but guard defensively so we never recurse.
  }
};

/**
 * Determines the portal's origin to use as postMessage targetOrigin.
 *
 * Primary source: document.referrer (the origin that loaded this iframe).
 *
 * Fallback: the `trustedAuthority` query string parameter that the Azure Portal
 * embeds in the iframe URL. This is needed because some browser privacy modes
 * (notably Firefox 's dynamic state partitioning / ETP Strict) can empty
 * document.referrer for cross-origin third-party iframes. Without this fallback,
 * postMessage would be called with an empty targetOrigin (which throws) and the
 * error logger itself routes through sendMessage, causing infinite recursion.
 *
 * Returns an empty string when no trustworthy origin can be derived, in which
 * case the caller must NOT call postMessage.
 */
const _getPortalTargetOrigin = (childWindow: Window): string => {
  const referrer = childWindow.document.referrer;
  if (referrer) {
    return referrer;
  }
  try {
    const trustedAuthority = new URLSearchParams(childWindow.location.search).get("trustedAuthority");
    if (trustedAuthority) {
      return new URL(trustedAuthority).origin;
    }
  } catch {
    // Malformed URL — fall through and return empty string.
  }
  return "";
};
