import Q from "q";
import * as MessageHandler from "./MessageHandler";

describe("Message Handler", () => {
  it("should handle cached message", async () => {
    let mockPromise = {
      id: "123",
      startTime: new Date(),
      deferred: Q.defer<any>()
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
      deferred: Q.defer<any>()
    };

    MessageHandler.handleCachedDataMessage(message);
    MessageHandler.runGarbageCollector();
    expect(MessageHandler.RequestMap["123"]).toBeUndefined();
  });

  describe("getDataExplorerWindow", () => {
    it("should return current window if current window has dataExplorerPlatform property", () => {
      const currentWindow: Window = { dataExplorerPlatform: 0 } as any;

      expect(MessageHandler.getDataExplorerWindow(currentWindow)).toEqual(currentWindow);
    });

    it("should return current window's parent if current window's parent has dataExplorerPlatform property", () => {
      const parentWindow: Window = { dataExplorerPlatform: 0 } as any;
      const currentWindow: Window = { parent: parentWindow } as any;

      expect(MessageHandler.getDataExplorerWindow(currentWindow)).toEqual(parentWindow);
    });

    it("should return undefined if none of the windows in the hierarchy have dataExplorerPlatform property and window's parent is reference to itself", () => {
      const parentWindow: Window = {} as any;
      (parentWindow as any).parent = parentWindow; // If a window does not have a parent, its parent property is a reference to itself.
      const currentWindow: Window = { parent: parentWindow } as any;

      expect(MessageHandler.getDataExplorerWindow(currentWindow)).toBeUndefined();
    });

    it("should return undefined if none of the windows in the hierarchy have dataExplorerPlatform property and window's parent is not defined", () => {
      const parentWindow: Window = {} as any;
      const currentWindow: Window = { parent: parentWindow } as any;

      expect(MessageHandler.getDataExplorerWindow(currentWindow)).toBeUndefined();
    });
  });
});
