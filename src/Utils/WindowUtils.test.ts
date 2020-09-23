import { getDataExplorerWindow } from "./WindowUtils";

const createWindow = (dataExplorerPlatform: unknown, parent: Window): Window => {
  // TODO: Need to `any` here since we're creating a mock window object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockWindow: any = {};
  if (dataExplorerPlatform !== undefined) {
    mockWindow.dataExplorerPlatform = dataExplorerPlatform;
  }
  if (parent) {
    mockWindow.parent = parent;
  }
  return mockWindow;
};

describe("WindowUtils", () => {
  describe("getDataExplorerWindow", () => {
    it("should return current window if current window has dataExplorerPlatform property", () => {
      const currentWindow = createWindow(0, undefined);

      expect(getDataExplorerWindow(currentWindow)).toEqual(currentWindow);
    });

    it("should return current window's parent if current window's parent has dataExplorerPlatform property", () => {
      const parentWindow = createWindow(0, undefined);
      const currentWindow = createWindow(undefined, parentWindow);

      expect(getDataExplorerWindow(currentWindow)).toEqual(parentWindow);
    });

    it("should return undefined if none of the windows in the hierarchy have dataExplorerPlatform property and window's parent is reference to itself", () => {
      const parentWindow = createWindow(undefined, undefined);

      // TODO: Need to `any` here since parent is a readonly property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parentWindow as any).parent = parentWindow; // If a window does not have a parent, its parent property is a reference to itself.
      const currentWindow = createWindow(undefined, parentWindow);

      expect(getDataExplorerWindow(currentWindow)).toBeUndefined();
    });

    it("should return undefined if none of the windows in the hierarchy have dataExplorerPlatform property and window's parent is not defined", () => {
      const parentWindow = createWindow(undefined, undefined);
      const currentWindow = createWindow(undefined, parentWindow);

      expect(getDataExplorerWindow(currentWindow)).toBeUndefined();
    });
  });
});
