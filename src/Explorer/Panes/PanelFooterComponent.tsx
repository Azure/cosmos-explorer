import { PrimaryButton } from "@fluentui/react";
import React from "react";

export interface PanelFooterProps {
  buttonLabel: string;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = ({
  buttonLabel,
}: PanelFooterProps): JSX.Element => (
  <div className="panelFooter">
    <PrimaryButton type="submit" id="sidePanelOkButton" text={buttonLabel} ariaLabel={buttonLabel} />
  </div>
);
