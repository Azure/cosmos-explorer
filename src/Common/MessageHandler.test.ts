import { MessageTypes } from "Contracts/ExplorerContracts";
import Explorer from "Explorer/Explorer";
import Q from "q";
import * as MessageValidation from "Utils/MessageValidation";
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

  it("should handle messages", async () => {
    const events = {
      isTrusted: true,
      data: {
        signature: "pcIframe",
        data: {
          type: MessageTypes.RefreshResources,
        },
      },
      origin: "https://ms.portal.azure.com",
      lastEventId: "",
    } as MessageEvent;
    const explorer = new Explorer();
    window.addEventListener = jest.fn().mockImplementationOnce((event, callback) => {
      callback(events);
    });

    jest.spyOn(MessageValidation, "isInvalidParentFrameOrigin").mockImplementation(() => false);
    jest.spyOn(MessageValidation, "shouldProcessMessage").mockImplementation(() => true);
    MessageHandler.addExplorerMessageHandlers(explorer);
    expect(MessageHandler.handleRefreshResources).toBeCalled;
  });
});
