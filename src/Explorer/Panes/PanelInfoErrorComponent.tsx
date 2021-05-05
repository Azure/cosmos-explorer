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
  let icon: JSX.Element;
  if (messageType === "error") {
    icon = <Icon iconName="StatusErrorFull" className="panelErrorIcon" data-testid="errorIcon" />;
  } else if (messageType === "warning") {
    icon = <Icon iconName="WarningSolid" className="panelWarningIcon" data-testid="warningIcon" />;
  } else if (messageType === "info") {
    icon = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" data-testid="InfoIcon" />;
  }

  return (
    formError && (
      <Stack className="panelInfoErrorContainer" horizontal verticalAlign="center">
        {icon}
        <span className="panelWarningErrorDetailsLinkContainer">
          <Text className="panelWarningErrorMessage" variant="small" data-testid="panelmessage">
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
    )
  );
};
