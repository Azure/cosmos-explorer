import "../../Explorer/Tables/DataTable/DataTableBindingManager";
import Explorer from "../../Explorer/Explorer";

export function initializeExplorer(): Explorer {
  const explorer = new Explorer();

  window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
  return explorer;
}
