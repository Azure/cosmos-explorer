import { IButtonStyles, IconButton, ITooltipHostStyles, TooltipHost } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import * as React from "react";

const calloutProps = { gapSpace: 0 };
const hostStyles: Partial<ITooltipHostStyles> = { root: { display: "inline-block" } };

export interface TooltipProps {
  children: string;
}

const iconButtonStyles: Partial<IButtonStyles> = { root: { marginBottom: -3 } };
const iconProps = { iconName: "Info" };

export const Tooltip: React.FunctionComponent = ({ children }: TooltipProps) => {
  const tooltipId = useId("tooltip");

  const iconButtonId: string = useId("iconButton");
  return (
    <span>
      <TooltipHost content={children} id={tooltipId} calloutProps={calloutProps} styles={hostStyles}>
        <IconButton id={iconButtonId} iconProps={iconProps} ariaLabel="Info" styles={iconButtonStyles} />
      </TooltipHost>
    </span>
  );
};
