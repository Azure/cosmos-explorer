import Q from "q";
import * as MessageHandler from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";

describe("Message Handler", () => {
  it.only("should send cached data message", async () => {
    const mock = jest.fn();
    window.parent.addEventListener("message", mock);
    MessageHandler.sendCachedDataMessage(MessageTypes.AllDatabases, ["some param"]);

    await new Promise(r => setTimeout(r, 1000));
    expect(mock).toHaveBeenCalled();
  });

  it("should handle cached message", async () => {
    let mockMessage = { message: { id: "123", data: "{}" } };

    MessageHandler.handleCachedDataMessage(mockMessage);
    expect(MessageHandler.RequestMap["123"]).toBeDefined();
  });

  it("should delete fulfilled promises on running the garbage collector", async () => {
    let message = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>()
    };

    MessageHandler.handleCachedDataMessage(message);
    MessageHandler.runGarbageCollector();
    expect(MessageHandler.RequestMap["123"]).toBeUndefined();
  });
});
