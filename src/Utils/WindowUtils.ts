export const getDataExplorerWindow = (currentWindow: Window): Window | undefined => {
  // Start with the current window and traverse up the parent hierarchy to find a window
  // with `dataExplorerPlatform` property
  let dataExplorerWindow: Window | undefined = currentWindow;

  try {
    // TODO: Need to `any` here since the window imports Explorer which can't be in strict mode yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    while (dataExplorerWindow && (dataExplorerWindow as any).dataExplorerPlatform == undefined) {
      // If a window does not have a parent, its parent property is a reference to itself.
      if (dataExplorerWindow.parent == dataExplorerWindow) {
        dataExplorerWindow = undefined;
      } else {
        dataExplorerWindow = dataExplorerWindow.parent;
      }
    }
  } catch (error) {
    // This can happen if we come across parent from a different origin
    dataExplorerWindow = undefined;
  }

  return dataExplorerWindow;
};
