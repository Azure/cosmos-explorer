import * as ViewModels from "../../../../Contracts/ViewModels";
import HostedTerminalIcon from "../../../../images/Hosted-Terminal.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { useNotebook } from "../../../Notebook/useNotebook";

export function createOpenCassandraTerminalButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Cassandra Shell";
  const tooltip =
    "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks.";
  const disableButton =
    !useNotebook.getState().isNotebooksEnabledForAccount && !useNotebook.getState().isNotebookEnabled;
  return {
    iconSrc: HostedTerminalIcon,
    iconAlt: label,
    onCommandClick: () => {
      if (useNotebook.getState().isNotebookEnabled) {
        container.openNotebookTerminal(ViewModels.TerminalKind.Cassandra);
      }
    },
    commandButtonLabel: label,
    hasPopup: false,
    disabled: disableButton,
    ariaLabel: label,
    tooltipText: !disableButton ? "" : tooltip,
  };
}
