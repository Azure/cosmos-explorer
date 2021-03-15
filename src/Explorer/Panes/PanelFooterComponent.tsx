import { PrimaryButton } from "office-ui-fabric-react";
import React from "react";

export interface PanelFooterProps {
  buttonLabel: string;
  onOKButtonClicked: () => void;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = (
  props: PanelFooterProps
): JSX.Element => (
  <div className="panelFooter">
    <PrimaryButton id="sidePanelOkButton" text={props.buttonLabel} onClick={() => props.onOKButtonClicked()} />
  </div>
);
