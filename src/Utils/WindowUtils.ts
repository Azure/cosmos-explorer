import { isFabric } from "Platform/Fabric/FabricUtil";
import { Platform, configContext } from "./../ConfigContext";

export const getDataExplorerWindow = (currentWindow: Window): Window | undefined => {
  // Data explorer is always loaded in an iframe, so traverse the parents until we hit the top and return the first child window.
  try {
    while (currentWindow) {
      if (currentWindow.parent === currentWindow) {
        return undefined;
      }
      if (isFabric() && currentWindow.parent.parent === currentWindow.top) {
        // in Fabric data explorer is inside an extension iframe, so we have two parent iframes
        return currentWindow;
      }
      if (configContext.platform !== Platform.Fabric && currentWindow.parent === currentWindow.top) {
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
