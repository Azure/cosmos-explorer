import { getDataExplorerWindow } from "./WindowUtils";

interface MockWindow {
  parent?: MockWindow;
  top?: MockWindow;
}

describe("WindowUtils", () => {
  describe("getDataExplorerWindow", () => {
    it("should return undefined if current window is at the top", () => {
      const mockWindow: MockWindow = {};
      mockWindow.parent = mockWindow;

      expect(getDataExplorerWindow(mockWindow as Window)).toEqual(undefined);
    });

    it("should return current window if parent is top", () => {
      const dataExplorerWindow: MockWindow = {};
      const portalWindow: MockWindow = {};
      dataExplorerWindow.parent = portalWindow;
      dataExplorerWindow.top = portalWindow;

      expect(getDataExplorerWindow(dataExplorerWindow as Window)).toEqual(dataExplorerWindow);
    });

    it("should return closest window to top if in nested windows", () => {
      const terminalWindow: MockWindow = {};
      const dataExplorerWindow: MockWindow = {};
      const portalWindow: MockWindow = {};
      dataExplorerWindow.top = portalWindow;
      dataExplorerWindow.parent = portalWindow;
      terminalWindow.top = portalWindow;
      terminalWindow.parent = dataExplorerWindow;

      expect(getDataExplorerWindow(terminalWindow as Window)).toEqual(dataExplorerWindow);
      expect(getDataExplorerWindow(dataExplorerWindow as Window)).toEqual(dataExplorerWindow);
    });
  });
});
