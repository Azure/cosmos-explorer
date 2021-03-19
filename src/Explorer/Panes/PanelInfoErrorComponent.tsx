import React from "react";
import { Icon, Link, Stack, Text } from "office-ui-fabric-react";

export interface PanelInfoErrorProps {
  message: string;
  messageType: string;
  showErrorDetails: boolean;
  link?: string;
  linkText?: string;
  openNotificationConsole?: () => void;
}

export const PanelInfoErrorComponent: React.FunctionComponent<PanelInfoErrorProps> = (
  props: PanelInfoErrorProps
): JSX.Element => {
  let icon: JSX.Element;
  if (props.messageType === "error") {
    icon = <Icon iconName="StatusErrorFull" className="panelErrorIcon" />;
  } else if (props.messageType === "warning") {
    icon = <Icon iconName="WarningSolid" className="panelWarningIcon" />;
  } else if (props.messageType === "info") {
    icon = <Icon iconName="InfoSolid" className="panelLargeInfoIcon" />;
  }

  return (
    <Stack className="panelInfoErrorContainer" horizontal verticalAlign="start">
      {icon}
      <span className="panelWarningErrorDetailsLinkContainer">
        <Text className="panelWarningErrorMessage" variant="small">
          {props.message}{" "}
          {props.link && props.linkText && (
            <Link target="_blank" href={props.link}>
              {props.linkText}
            </Link>
          )}
        </Text>
        {props.showErrorDetails && (
          <a className="paneErrorLink" role="link" onClick={props.openNotificationConsole}>
            More details
          </a>
        )}
      </span>
    </Stack>
  );
};
