import React from "react";
import { PrimaryButton } from "@fluentui/react";

export interface PanelFooterProps {
  buttonLabel: string;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = (
  props: PanelFooterProps
): JSX.Element => (
  <div className="panelFooter">
    <PrimaryButton type="submit" id="sidePanelOkButton" text={props.buttonLabel} />
  </div>
);
