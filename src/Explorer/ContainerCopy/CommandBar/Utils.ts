import AddIcon from "../../../../images/Add.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import RefreshIcon from "../../../../images/refresh-cosmos.svg";
import { configContext, Platform } from "../../../ConfigContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as Actions from "../Actions/CopyJobActions";
import ContainerCopyMessages from "../ContainerCopyMessages";
import { MonitorCopyJobsRefState } from "../MonitorCopyJobs/MonitorCopyJobRefState";
import { CopyJobCommandBarBtnType } from "../Types/CopyJobTypes";

function getCopyJobBtns(explorer: Explorer): CopyJobCommandBarBtnType[] {
  const monitorCopyJobsRef = MonitorCopyJobsRefState((state) => state.ref);
  const buttons: CopyJobCommandBarBtnType[] = [
    {
      key: "createCopyJob",
      iconSrc: AddIcon,
      label: ContainerCopyMessages.createCopyJobButtonLabel,
      ariaLabel: ContainerCopyMessages.createCopyJobButtonAriaLabel,
      onClick: () => Actions.openCreateCopyJobPanel(explorer),
    },
    {
      key: "refresh",
      iconSrc: RefreshIcon,
      label: ContainerCopyMessages.refreshButtonLabel,
      ariaLabel: ContainerCopyMessages.refreshButtonAriaLabel,
      onClick: () => monitorCopyJobsRef?.refreshJobList(),
    },
  ];
  if (configContext.platform === Platform.Portal) {
    buttons.push({
      key: "feedback",
      iconSrc: FeedbackIcon,
      label: ContainerCopyMessages.feedbackButtonLabel,
      ariaLabel: ContainerCopyMessages.feedbackButtonAriaLabel,
      onClick: () => {
        explorer.openContainerCopyFeedbackBlade();
      },
    });
  }
  return buttons;
}

function btnMapper(config: CopyJobCommandBarBtnType): CommandButtonComponentProps {
  return {
    iconSrc: config.iconSrc,
    iconAlt: config.label,
    onCommandClick: config.onClick,
    commandButtonLabel: undefined as string | undefined,
    ariaLabel: config.ariaLabel,
    tooltipText: config.label,
    hasPopup: false,
    disabled: config.disabled ?? false,
  };
}

export function getCommandBarButtons(explorer: Explorer): CommandButtonComponentProps[] {
  return getCopyJobBtns(explorer).map(btnMapper);
}
