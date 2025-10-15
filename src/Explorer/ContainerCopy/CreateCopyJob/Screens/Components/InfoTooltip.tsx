import { Image, ITooltipHostStyles, TooltipHost } from "@fluentui/react";
import React from "react";
import InfoIcon from "../../../../../../images/Info.svg";

const InfoTooltip: React.FC<{ content?: string }> = ({ content }) => {
    if (!content) return null;
    const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
    return (
        <TooltipHost content={content} calloutProps={{ gapSpace: 0 }} styles={hostStyles}>
            <Image src={InfoIcon} alt="Information" width={14} height={14} />
        </TooltipHost>
    );
};

export default React.memo(InfoTooltip);