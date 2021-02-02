import React from "react";
import { Icon, Text } from "office-ui-fabric-react";

export interface PanelErrorProps {
  message: string;
  isWarning: boolean;
  showErrorDetails: boolean;
  openNotificationConsole?: () => void;
}

export class PanelErrorComponent extends React.Component<PanelErrorProps> {
  render(): JSX.Element {
    return (
      <div className="panelWarningErrorContainer">
        {this.getIcon()}
        <span className="panelWarningErrorDetailsLinkContainer">
          <Text className="panelWarningErrorMessage" variant="small">
            {this.props.message}
          </Text>
          {this.props.showErrorDetails && (
            <a className="paneErrorLink" role="link" onClick={this.props.openNotificationConsole}>
              More details
            </a>
          )}
        </span>
      </div>
    );
  }

  private getIcon(): JSX.Element {
    return this.props.isWarning ? (
      <Icon iconName="WarningSolid" className="panelWarningIcon" />
    ) : (
      <Icon iconName="StatusErrorFull" className="panelErrorIcon" />
    );
  }
}
