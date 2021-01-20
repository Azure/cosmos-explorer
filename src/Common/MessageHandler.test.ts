import Q from "q";
import * as MessageHandler from "./MessageHandler";

describe("Message Handler", () => {
  it("should handle cached message", async () => {
    let mockPromise = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>(),
    };
    let mockMessage = { message: { id: "123", data: "{}" } };
    MessageHandler.RequestMap[mockPromise.id] = mockPromise;
    MessageHandler.handleCachedDataMessage(mockMessage);
    expect(mockPromise.deferred.promise.isFulfilled()).toBe(true);
  });

  it("should delete fulfilled promises on running the garbage collector", async () => {
    let message = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>(),
    };

    MessageHandler.handleCachedDataMessage(message);
    MessageHandler.runGarbageCollector();
    expect(MessageHandler.RequestMap["123"]).toBeUndefined();
  });
});
