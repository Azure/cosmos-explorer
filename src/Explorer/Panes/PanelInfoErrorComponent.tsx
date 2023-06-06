import { Icon, Link, Stack, Text } from "@fluentui/react";
import React from "react";
import { useNotificationConsole } from "../../hooks/useNotificationConsole";

export interface PanelInfoErrorProps {
  message: string;
  messageType: string;
  showErrorDetails: boolean;
  link?: string;
  linkText?: string;
  formError?: boolean;
}

export const PanelInfoErrorComponent: React.FunctionComponent<PanelInfoErrorProps> = ({
  message,
  messageType,
  showErrorDetails,
  link,
  linkText,
}: PanelInfoErrorProps): JSX.Element => {
  const expandConsole = useNotificationConsole((state) => state.expandConsole);

  let icon: JSX.Element = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" aria-label="Infomation" />;
  if (messageType === "error") {
    icon = <Icon iconName="StatusErrorFull" className="panelErrorIcon" aria-label="error" />;
  } else if (messageType === "warning") {
    icon = <Icon iconName="WarningSolid" className="panelWarningIcon" aria-label="warning" />;
  } else if (messageType === "info") {
    icon = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" aria-label="Infomation" />;
  }

  return (
    <Stack className="panelInfoErrorContainer" horizontal verticalAlign="center">
      {icon}
      <span className="panelWarningErrorDetailsLinkContainer" role="alert" aria-live="assertive">
        <Text aria-label={message} className="panelWarningErrorMessage" variant="small">
          {message}
          {link && linkText && (
            <Link target="_blank" href={link}>
              {" " + linkText}
            </Link>
          )}
        </Text>
        {showErrorDetails && (
          <a className="paneErrorLink" role="button" onClick={expandConsole} tabIndex={0} onKeyPress={expandConsole}>
            More details
          </a>
        )}
      </span>
    </Stack>
  );
};
