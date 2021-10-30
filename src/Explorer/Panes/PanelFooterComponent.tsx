import { PrimaryButton } from "@fluentui/react";
import React from "react";

export interface PanelFooterProps {
  buttonLabel: string;
  isButtonDisabled?: boolean;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = ({
  buttonLabel,
  isButtonDisabled,
}: PanelFooterProps): JSX.Element => (
  <div className="panelFooter">
    <PrimaryButton
      type="submit"
      id="sidePanelOkButton"
      text={buttonLabel}
      ariaLabel={buttonLabel}
      disabled={!!isButtonDisabled}
    />
  </div>
);
