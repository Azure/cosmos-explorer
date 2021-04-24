import { useId } from "@uifabric/react-hooks";
import { IButtonStyles, IconButton } from "office-ui-fabric-react";
import { ITooltipHostStyles, TooltipHost } from "office-ui-fabric-react/lib/Tooltip";
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
