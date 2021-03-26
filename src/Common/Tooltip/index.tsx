import { useId } from "@uifabric/react-hooks";
import { ITooltipHostStyles, TooltipHost } from "office-ui-fabric-react/lib/Tooltip";
import * as React from "react";
import InfoBubble from "../../../images/info-bubble.svg";

const calloutProps = { gapSpace: 0 };
const hostStyles: Partial<ITooltipHostStyles> = { root: { display: "inline-block" } };

export interface TooltipProps {
  children: string;
}
export const Tooltip: React.FunctionComponent = ({ children }: TooltipProps) => {
  const tooltipId = useId("tooltip");

  return (
    <span>
      <TooltipHost content={children} id={tooltipId} calloutProps={calloutProps} styles={hostStyles}>
        <img className="infoImg" src={InfoBubble} alt="More information" />
      </TooltipHost>
    </span>
  );
};
