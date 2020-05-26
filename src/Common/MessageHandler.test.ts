import Q from "q";
import { CachedDataPromise, MessageHandler } from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";

class MockMessageHandler extends MessageHandler {
  public static addToMap(key: string, value: CachedDataPromise<any>): void {
    MessageHandler.RequestMap[key] = value;
  }

  public static mapContainsKey(key: string): boolean {
    return MessageHandler.RequestMap[key] != null;
  }

  public static clearAllEntries(): void {
    MessageHandler.RequestMap = {};
  }

  public static runGarbageCollector(): void {
    MessageHandler.runGarbageCollector();
  }
}

describe("Message Handler", () => {
  beforeEach(() => {
    MockMessageHandler.clearAllEntries();
  });

  xit("should send cached data message", (done: any) => {
    const testValidationCallback = (e: MessageEvent) => {
      expect(e.data.data).toEqual(
        jasmine.objectContaining({ type: MessageTypes.AllDatabases, params: ["some param"] })
      );
      e.currentTarget.removeEventListener(e.type, testValidationCallback);
      done();
    };
    window.parent.addEventListener("message", testValidationCallback);
    MockMessageHandler.sendCachedDataMessage(MessageTypes.AllDatabases, ["some param"]);
  });

  it("should handle cached message", () => {
    let mockPromise: CachedDataPromise<any> = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>()
    };
    let mockMessage = { message: { id: "123", data: "{}" } };

    MockMessageHandler.addToMap(mockPromise.id, mockPromise);
    MockMessageHandler.handleCachedDataMessage(mockMessage);
    expect(mockPromise.deferred.promise.isFulfilled()).toBe(true);
  });

  it("should delete fulfilled promises on running the garbage collector", () => {
    let mockPromise: CachedDataPromise<any> = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>()
    };

    MockMessageHandler.addToMap(mockPromise.id, mockPromise);
    mockPromise.deferred.reject("some error");
    MockMessageHandler.runGarbageCollector();
    expect(MockMessageHandler.mapContainsKey(mockPromise.id)).toBe(false);
  });
});
