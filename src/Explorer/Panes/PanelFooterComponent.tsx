import React from "react";
import { PrimaryButton } from "office-ui-fabric-react";

export interface PanelFooterProps {
  buttonLabel: string;
  onOKButtonClicked: () => void;
}

export class PanelFooterComponent extends React.Component<PanelFooterProps> {
  render(): JSX.Element {
    return (
      <div className="panelFooter">
        <PrimaryButton text={this.props.buttonLabel} onClick={() => this.props.onOKButtonClicked()} />
      </div>
    );
  }
}
