import { PrimaryButton } from "@fluentui/react";
import React, { CSSProperties } from "react";

export interface PanelFooterProps {
  buttonLabel: string;
  isButtonDisabled?: boolean;
  style?: CSSProperties;
}

export const PanelFooterComponent: React.FunctionComponent<PanelFooterProps> = ({
  buttonLabel,
  isButtonDisabled,
  style,
}: PanelFooterProps): JSX.Element => (
  <div className="panelFooter" style={style}>
    <PrimaryButton
      type="submit"
      id="sidePanelOkButton"
      data-testid="Panel/OkButton"
      text={buttonLabel}
      ariaLabel={buttonLabel}
      disabled={!!isButtonDisabled}
    />
  </div>
);
