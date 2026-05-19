import AddIcon from "../../../../images/Add.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import MoonIcon from "../../../../images/MoonIcon.svg";
import RefreshIcon from "../../../../images/refresh-cosmos.svg";
import SunIcon from "../../../../images/SunIcon.svg";
import { configContext, Platform } from "../../../ConfigContext";
import { useThemeStore } from "../../../hooks/useTheme";
import { Keys, t } from "Localization";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as Actions from "../Actions/CopyJobActions";
import { MonitorCopyJobsRefState } from "../MonitorCopyJobs/MonitorCopyJobRefState";
import { CopyJobCommandBarBtnType } from "../Types/CopyJobTypes";

function getCopyJobBtns(explorer: Explorer, isDarkMode: boolean): CopyJobCommandBarBtnType[] {
  const monitorCopyJobsRef = MonitorCopyJobsRefState((state) => state.ref);
  const isPortal = configContext.platform === Platform.Portal;
  const buttons: CopyJobCommandBarBtnType[] = [
    {
      key: "createCopyJob",
      iconSrc: AddIcon,
      label: t(Keys.containerCopy.commandBar.createCopyJobButtonLabel),
      ariaLabel: t(Keys.containerCopy.commandBar.createCopyJobButtonAriaLabel),
      onClick: () => Actions.openCreateCopyJobPanel(explorer),
    },
    {
      key: "refresh",
      iconSrc: RefreshIcon,
      label: t(Keys.common.refresh),
      ariaLabel: t(Keys.containerCopy.commandBar.refreshButtonAriaLabel),
      onClick: () => monitorCopyJobsRef?.refreshJobList(),
    },
    {
      key: "themeToggle",
      iconSrc: isDarkMode ? SunIcon : MoonIcon,
      label: isDarkMode ? "Light Theme" : "Dark Theme",
      ariaLabel: isPortal
        ? "Dark Mode is managed in Azure Portal Settings"
        : isDarkMode
        ? "Switch to Light Theme"
        : "Switch to Dark Theme",
      disabled: isPortal,
      onClick: isPortal ? () => {} : () => useThemeStore.getState().toggleTheme(),
    },
  ];

  if (configContext.platform === Platform.Portal) {
    buttons.push({
      key: "feedback",
      iconSrc: FeedbackIcon,
      label: t(Keys.containerCopy.commandBar.feedbackButtonLabel),
      ariaLabel: t(Keys.containerCopy.commandBar.feedbackButtonAriaLabel),
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

export function getCommandBarButtons(explorer: Explorer, isDarkMode: boolean): CommandButtonComponentProps[] {
  return getCopyJobBtns(explorer, isDarkMode).map(btnMapper);
}
