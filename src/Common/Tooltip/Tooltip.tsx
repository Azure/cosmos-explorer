import { ITooltipHostStyles, TooltipHost } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { ReactComponent as InfoBubble } from "images/info-bubble.svg";
import * as React from "react";

const calloutProps = { gapSpace: 0 };
const hostStyles: Partial<ITooltipHostStyles> = { root: { display: "inline-block" } };

export interface TooltipProps {
  children: string;
}
export const Tooltip: React.FunctionComponent = ({ children }: TooltipProps) => {
  const tooltipId = useId("tooltip");

  return children ? (
    <span>
      <TooltipHost content={children} id={tooltipId} calloutProps={calloutProps} styles={hostStyles}>
        <InfoBubble />
      </TooltipHost>
    </span>
  ) : (
    <></>
  );
};
