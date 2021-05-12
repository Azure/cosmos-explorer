import { Icon, Link, Stack, Text } from "@fluentui/react";
import React from "react";

export interface PanelInfoErrorProps {
  message: string;
  messageType: string;
  showErrorDetails: boolean;
  link?: string;
  linkText?: string;
  openNotificationConsole?: () => void;
  formError?: boolean;
}

export const PanelInfoErrorComponent: React.FunctionComponent<PanelInfoErrorProps> = ({
  message,
  messageType,
  showErrorDetails,
  link,
  linkText,
  openNotificationConsole,
  formError = true,
}: PanelInfoErrorProps): JSX.Element => {
  let icon: JSX.Element = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" aria-label="Infomation" />;
  if (messageType === "error") {
    icon = <Icon iconName="StatusErrorFull" className="panelErrorIcon" aria-label="error" />;
  } else if (messageType === "warning") {
    icon = <Icon iconName="WarningSolid" className="panelWarningIcon" aria-label="warning" />;
  } else if (messageType === "info") {
    icon = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" aria-label="Infomation" />;
  }

  return formError ? (
    <Stack className="panelInfoErrorContainer" horizontal verticalAlign="center">
      {icon}
      <span className="panelWarningErrorDetailsLinkContainer">
        <Text className="panelWarningErrorMessage" variant="small" aria-label="message">
          {message}
          {link && linkText && (
            <Link target="_blank" href={link}>
              {linkText}
            </Link>
          )}
        </Text>
        {showErrorDetails && (
          <a className="paneErrorLink" role="link" onClick={openNotificationConsole}>
            More details
          </a>
        )}
      </span>
    </Stack>
  ) : (
    <div />
  );
};
