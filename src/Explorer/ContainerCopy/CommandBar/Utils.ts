import AddIcon from "../../../../images/Add.svg";
import FeedbackIcon from "../../../../images/Feedback-Command.svg";
import RefreshIcon from "../../../../images/refresh-cosmos.svg";
import { configContext, Platform } from "../../../ConfigContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as Actions from "../Actions/CopyJobActions";
import ContainerCopyMessages from "../ContainerCopyMessages";
import { CopyJobCommandBarBtnType } from "../Types";

function getCopyJobBtns(): CopyJobCommandBarBtnType[] {
    const buttons: CopyJobCommandBarBtnType[] = [
        {
            key: "createCopyJob",
            iconSrc: AddIcon,
            label: ContainerCopyMessages.createCopyJobButtonLabel,
            ariaLabel: ContainerCopyMessages.createCopyJobButtonAriaLabel,
            onClick: Actions.openCreateCopyJobPanel,
        },
        {
            key: "refresh",
            iconSrc: RefreshIcon,
            label: ContainerCopyMessages.refreshButtonLabel,
            ariaLabel: ContainerCopyMessages.refreshButtonAriaLabel,
            onClick: () => { },
        },
    ];
    if (configContext.platform === Platform.Portal) {
        buttons.push({
            key: "feedback",
            iconSrc: FeedbackIcon,
            label: ContainerCopyMessages.feedbackButtonLabel,
            ariaLabel: ContainerCopyMessages.feedbackButtonAriaLabel,
            onClick: () => { },
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

export function getCommandBarButtons(_container: Explorer): CommandButtonComponentProps[] {
    return getCopyJobBtns().map(btnMapper);
}

