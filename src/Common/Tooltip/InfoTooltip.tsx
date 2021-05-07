import { IconButton, TooltipHost } from "@fluentui/react";
import * as React from "react";

export interface TooltipProps {
  children: string;
}

const iconProps = { iconName: "Info" };

export const InfoTooltip: React.FunctionComponent = ({ children }: TooltipProps) => {
  return (
    <span>
      <TooltipHost content={children}>
        <IconButton iconProps={iconProps} ariaLabel="Info" vertical-align />
      </TooltipHost>
    </span>
  );
};
