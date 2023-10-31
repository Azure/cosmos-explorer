import * as ViewModels from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useNotebook } from "../../../Notebook/useNotebook";
import { SelectedNodeState } from "../../../useSelectedNode";

export function createContextCommandBarButtons(
  container: Explorer,
  selectedNodeState: SelectedNodeState
): CommandButtonComponentProps[] {
  if (selectedNodeState.isDatabaseNodeOrNoneSelected()) {
    return [];
  }

  if (userContext.apiType !== "Mongo") {
    return [];
  }

  const label = useNotebook.getState().isShellEnabled ? "Open Mongo Shell" : "New Shell";

  const newMongoShellBtn: CommandButtonComponentProps = {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
      if (useNotebook.getState().isShellEnabled) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Mongo);
      } else {
        selectedCollection && selectedCollection.onNewMongoShellClick();
      }
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
  };

  return [newMongoShellBtn];
}
