import React from "react";
import { PrimaryButton } from "office-ui-fabric-react";

export interface PanelFooterProps {
  buttonLabel: string;
  onOKButtonClicked: () => void;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = (
  props: PanelFooterProps
): JSX.Element => (
  <div className="panelFooter">
    <PrimaryButton text={props.buttonLabel} onClick={() => props.onOKButtonClicked()} />
  </div>
);
