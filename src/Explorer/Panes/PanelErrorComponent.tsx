import { Icon, Text } from "office-ui-fabric-react";
import React from "react";

export interface PanelErrorProps {
  message: string;
  isWarning: boolean;
  showErrorDetails: boolean;
  openNotificationConsole?: () => void;
}

export const PanelErrorComponent: React.FunctionComponent<PanelErrorProps> = (props: PanelErrorProps): JSX.Element => (
  <div className="panelWarningErrorContainer">
    {props.isWarning ? (
      <Icon iconName="WarningSolid" className="panelWarningIcon" />
    ) : (
      <Icon iconName="StatusErrorFull" className="panelErrorIcon" />
    )}
    <span className="panelWarningErrorDetailsLinkContainer">
      <Text className="panelWarningErrorMessage" variant="small">
        {props.message}
      </Text>
      {props.showErrorDetails && (
        <a className="paneErrorLink" role="link" onClick={props.openNotificationConsole}>
          More details
        </a>
      )}
    </span>
  </div>
);
