import { MessageTypes } from "../Contracts/ExplorerContracts";
import Q from "q";
import * as _ from "underscore";
import * as Constants from "./Constants";

export interface CachedDataPromise<T> {
  deferred: Q.Deferred<T>;
  startTime: Date;
  id: string;
}

/**
 * For some reason, typescript emits a Map() in the compiled js output(despite the target being set to ES5) forcing us to define our own polyfill,
 * so we define our own custom implementation of the ES6 Map to work around it.
 */
type Map = { [key: string]: CachedDataPromise<any> };

export class MessageHandler {
  protected static RequestMap: Map = {};

  public static handleCachedDataMessage(message: any): void {
    const messageContent = message && message.message;
    if (
      message == null ||
      messageContent == null ||
      messageContent.id == null ||
      !MessageHandler.RequestMap[messageContent.id]
    ) {
      return;
    }

    const cachedDataPromise = MessageHandler.RequestMap[messageContent.id];
    if (messageContent.error != null) {
      cachedDataPromise.deferred.reject(messageContent.error);
    } else {
      cachedDataPromise.deferred.resolve(JSON.parse(messageContent.data));
    }
    MessageHandler.runGarbageCollector();
  }

  public static sendCachedDataMessage<TResponseDataModel>(
    messageType: MessageTypes,
    params: Object[],
    timeoutInMs?: number
  ): Q.Promise<TResponseDataModel> {
    let cachedDataPromise: CachedDataPromise<TResponseDataModel> = {
      deferred: Q.defer<TResponseDataModel>(),
      startTime: new Date(),
      id: _.uniqueId(),
    };
    MessageHandler.RequestMap[cachedDataPromise.id] = cachedDataPromise;
    MessageHandler.sendMessage({ type: messageType, params: params, id: cachedDataPromise.id });

    //TODO: Use telemetry to measure optimal time to resolve/reject promises
    return cachedDataPromise.deferred.promise.timeout(
      timeoutInMs || Constants.ClientDefaults.requestTimeoutMs,
      "Timed out while waiting for response from portal"
    );
  }

  public static sendMessage(data: any): void {
    if (MessageHandler.canSendMessage()) {
      window.parent.postMessage(
        {
          signature: "pcIframe",
          data: data,
        },
        window.document.referrer
      );
    }
  }

  public static canSendMessage(): boolean {
    return window.parent !== window;
  }

  protected static runGarbageCollector() {
    Object.keys(MessageHandler.RequestMap).forEach((key: string) => {
      const promise: Q.Promise<any> = MessageHandler.RequestMap[key].deferred.promise;
      if (promise.isFulfilled() || promise.isRejected()) {
        delete MessageHandler.RequestMap[key];
      }
    });
  }
}
