import "../../Explorer/Tables/DataTable/DataTableBindingManager";
import Explorer from "../../Explorer/Explorer";
import { handleMessage } from "../../Controls/Heatmap/Heatmap";

export function initializeExplorer(): Explorer {
  const explorer = new Explorer();

  // In development mode, try to load the iframe message from session storage.
  // This allows webpack hot reload to funciton properly
  if (process.env.NODE_ENV === "development") {
    const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
    if (initMessage) {
      const message = JSON.parse(initMessage);
      console.warn("Loaded cached portal iframe message from session storage");
      console.dir(message);
      explorer.initDataExplorerWithFrameInputs(message);
    }
  }

  window.addEventListener("message", explorer.handleMessage.bind(explorer), false);

  return explorer;
}
