import NewNotebookIcon from "../../../../images/notebook/Notebook-new.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useSelectedNode } from "../../../useSelectedNode";

export function createNewNotebookButton(container: Explorer): CommandButtonComponentProps {
  const label = "New Notebook";
  return {
    id: "newNotebookBtn",
    iconSrc: NewNotebookIcon,
    iconAlt: label,
    onCommandClick: () => container.onNewNotebookClicked(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    ariaLabel: label,
  };
}
