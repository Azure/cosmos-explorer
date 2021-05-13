import { Icon, TooltipHost } from "@fluentui/react";
import * as React from "react";

export interface TooltipProps {
  children: string;
}

export const InfoTooltip: React.FunctionComponent<TooltipProps> = ({ children }: TooltipProps) => {
  return (
    <span>
      <TooltipHost content={children}>
        <Icon iconName="Info" ariaLabel="Info" className="panelInfoIcon" />
      </TooltipHost>
    </span>
  );
};
