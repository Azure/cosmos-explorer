import * as ViewModels from "../../../../Contracts/ViewModels";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useNotebook } from "../../../Notebook/useNotebook";
import { useSelectedNode } from "../../../useSelectedNode";

export function createOpenPsqlTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open PSQL Shell";
  const disableButton =
    (!useNotebook.getState().isNotebooksEnabledForAccount && !useNotebook.getState().isNotebookEnabled) ||
    useSelectedNode.getState().isQueryCopilotCollectionSelected();
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (useNotebook.getState().isNotebookEnabled) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Postgres);
      }
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: disableButton,
    ariaLabel: label,
    tooltipText: !disableButton
      ? ""
      : "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.",
  };
}
