import React, { FunctionComponent } from "react";
import InfoBubble from "../../../../../images/info-bubble.svg";

export interface TooltipProps {
  children: React.ReactNode;
}

export const Tooltip: FunctionComponent<TooltipProps> = ({ children }: TooltipProps) => {
  return (
    <span className="infoTooltip" role="tooltip" tabIndex={0}>
      <img className="infoImg" src={InfoBubble} alt="More information" />
      <span className="tooltiptext pageOptionTooltipWidth">{children}</span>
    </span>
  );
};
