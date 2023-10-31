import ResetWorkspaceIcon from "../../../../images/notebook/Notebook-reset-workspace.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useSelectedNode } from "../../../useSelectedNode";

export function createNotebookWorkspaceResetButton(container: Explorer): CommandButtonComponentProps {
  const label = "Reset Workspace";
  return {
    iconSrc: ResetWorkspaceIcon,
    iconAlt: label,
    onCommandClick: () => container.resetNotebookWorkspace(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    ariaLabel: label,
  };
}
