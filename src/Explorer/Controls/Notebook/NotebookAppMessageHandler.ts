/**
 * Message handler to communicate with NotebookApp iframe
 */
import Q from "q";
import * as _ from "underscore";

import { HashMap } from "../../../Common/HashMap";
import { CachedDataPromise } from "../../../Common/MessageHandler";
import * as Constants from "../../../Common/Constants";
import {
  MessageTypes,
  FromNotebookMessage,
  FromNotebookResponseMessage,
  FromDataExplorerMessage
} from "../../../Terminal/NotebookAppContracts";

export class NotebookAppMessageHandler {
  private requestMap: HashMap<CachedDataPromise<any>>;

  constructor(private targetIFrameWindow: Window) {
    this.requestMap = new HashMap();
  }

  public handleCachedDataMessage(message: FromNotebookMessage): void {
    const messageContent = message && (message.message as FromNotebookResponseMessage);
    if (
      message == null ||
      messageContent == null ||
      messageContent.id == null ||
      !this.requestMap.has(messageContent.id)
    ) {
      return;
    }

    const cachedDataPromise = this.requestMap.get(messageContent.id);
    if (messageContent.error != null) {
      cachedDataPromise.deferred.reject(messageContent.error);
    } else {
      cachedDataPromise.deferred.resolve(messageContent.data);
    }
    this.runGarbageCollector();
  }

  public sendCachedDataMessage<TResponseDataModel>(
    messageType: MessageTypes,
    params?: any
  ): Q.Promise<TResponseDataModel> {
    let cachedDataPromise: CachedDataPromise<TResponseDataModel> = {
      deferred: Q.defer<TResponseDataModel>(),
      startTime: new Date(),
      id: _.uniqueId()
    };
    this.requestMap.set(cachedDataPromise.id, cachedDataPromise);
    this.sendMessage({ type: messageType, params: params, id: cachedDataPromise.id });

    //TODO: Use telemetry to measure optimal time to resolve/reject promises
    return cachedDataPromise.deferred.promise.timeout(
      Constants.ClientDefaults.requestTimeoutMs,
      "Timed out while waiting for response from portal"
    );
  }

  public sendMessage(data: FromDataExplorerMessage): void {
    if (!this.targetIFrameWindow) {
      console.error("targetIFrame not defined. This is not expected");
      return;
    }

    this.targetIFrameWindow.postMessage(data, window.location.href || window.document.referrer);
  }

  protected runGarbageCollector() {
    this.requestMap.keys().forEach((key: string) => {
      const promise: Q.Promise<any> = this.requestMap.get(key).deferred.promise;
      if (promise.isFulfilled() || promise.isRejected()) {
        this.requestMap.delete(key);
      }
    });
  }
}
