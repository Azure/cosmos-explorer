import { Icon, TooltipHost } from "@fluentui/react";
import * as React from "react";

export interface TooltipProps {
  children: string;
  className?: string;
}

export const InfoTooltip: React.FunctionComponent<TooltipProps> = ({ children, className }: TooltipProps) => {
  return (
    <span className={className}>
      <TooltipHost content={children}>
        <Icon iconName="Info" ariaLabel={children} className="panelInfoIcon" tabIndex={0} />
      </TooltipHost>
    </span>
  );
};
