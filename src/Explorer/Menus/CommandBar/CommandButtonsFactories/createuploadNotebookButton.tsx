import NewNotebookIcon from "../../../../images/notebook/Notebook-new.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useSelectedNode } from "../../../useSelectedNode";

export function createuploadNotebookButton(container: Explorer): CommandButtonComponentProps {
  const label = "Upload to Notebook Server";
  return {
    iconSrc: NewNotebookIcon,
    iconAlt: label,
    onCommandClick: () => container.openUploadFilePanel(),
    commandButtonLabel: label,
    hasPopup: false,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    ariaLabel: label,
  };
}
