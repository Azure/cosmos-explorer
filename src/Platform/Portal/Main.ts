import * as ViewModels from "../../Contracts/ViewModels";
import PortalExplorerFactory from "./ExplorerFactory";
import "../../Explorer/Tables/DataTable/DataTableBindingManager";

export function initializeExplorer(): ViewModels.Explorer {
  const portalExplorerFactory = new PortalExplorerFactory();
  const explorer = portalExplorerFactory.createExplorer();

  window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
  return explorer;
}
