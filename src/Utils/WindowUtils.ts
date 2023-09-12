export const getDataExplorerWindow = (currentWindow: Window): Window | undefined => {
  // Data explorer is always loaded in an iframe, so traverse the parents until we hit the top and return the first child window.
  try {
    while (currentWindow) {
      if (currentWindow.parent === currentWindow) {
        return undefined;
      }
      if (currentWindow.parent.parent === currentWindow.top) {
        // Fabric
        return currentWindow;
      }
      if (currentWindow.parent === currentWindow.top) {
        return currentWindow;
      }
      currentWindow = currentWindow.parent;
    }
  } catch (error) {
    // Hitting a cross domain error means we are in the portal and the current window is data explorer
    return currentWindow;
  }
  return undefined;
};
