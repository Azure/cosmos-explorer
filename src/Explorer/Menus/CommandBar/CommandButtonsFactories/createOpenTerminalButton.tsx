import * as ViewModels from "../../../../Contracts/ViewModels";
import CosmosTerminalIcon from "../../../../images/Cosmos-Terminal.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useSelectedNode } from "../../../useSelectedNode";

export function createOpenTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Terminal";
  return {
    iconSrc: CosmosTerminalIcon,
    iconAlt: label,
    onCommandClick: () => container.openNotebookTerminal(ViewModels.TerminalKind.Default),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    ariaLabel: label,
  };
}
