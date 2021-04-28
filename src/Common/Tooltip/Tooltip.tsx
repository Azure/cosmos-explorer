import { useId } from "@uifabric/react-hooks";
import InfoBubble from "images/info-bubble.svg";
import { ITooltipHostStyles, TooltipHost } from "office-ui-fabric-react/lib/Tooltip";
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
        <img className="infoImg" src={InfoBubble} alt="More information" />
      </TooltipHost>
    </span>
  ) : (
    <></>
  );
};
