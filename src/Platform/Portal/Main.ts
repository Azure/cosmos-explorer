import PortalExplorerFactory from "./ExplorerFactory";
import "../../Explorer/Tables/DataTable/DataTableBindingManager";
import Explorer from "../../Explorer/Explorer";

export function initializeExplorer(): Explorer {
  const portalExplorerFactory = new PortalExplorerFactory();
  const explorer = portalExplorerFactory.createExplorer();

  window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
  return explorer;
}
