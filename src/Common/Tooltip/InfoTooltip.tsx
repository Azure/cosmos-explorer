import { Icon, TooltipHost } from "@fluentui/react";
import * as React from "react";

export interface TooltipProps {
  children: string;
  className?: string;
  ariaLabelForTooltip?: string;
}

export const InfoTooltip: React.FunctionComponent<TooltipProps> = ({
  children,
  className,
  ariaLabelForTooltip = children,
}: TooltipProps) => {
  return (
    <span className={className}>
      <TooltipHost content={children}>
        <Icon iconName="Info" aria-label={ariaLabelForTooltip} className="panelInfoIcon" tabIndex={0} />
      </TooltipHost>
    </span>
  );
};
