import { DirectionalHint, IContextualMenuProps, IconButton } from "@fluentui/react";
import React from "react";
import ExplainIcon from "../../../../../../../../images/CopilotExplain.svg";
import OptimizeIcon from "../../../../../../../../images/CopilotOptimize.svg";
import RegenerateIcon from "../../../../../../../../images/CopilotRegenerate.svg";
import SimplifyIcon from "../../../../../../../../images/CopilotSimplify.svg";

export const MoreButton: React.FC = (): JSX.Element => {
  const menuProps: IContextualMenuProps = {
    items: [
      {
        key: "regenerate",
        text: "Regenerate code",
        iconProps: { imageProps: { src: RegenerateIcon } },
      },
      {
        key: "explain",
        text: "Explain code",
        iconProps: { imageProps: { src: ExplainIcon } },
      },
      {
        key: "optimize",
        text: "Optimize",
        iconProps: { imageProps: { src: OptimizeIcon } },
      },
      {
        key: "simplify",
        text: "Simplify",
        iconProps: { imageProps: { src: SimplifyIcon } },
      },
    ],
    directionalHint: DirectionalHint.topRightEdge,
    calloutProps: {
      styles: { calloutMain: { borderRadius: "4px" }, root: { borderRadius: "4px" } },
    },
  };

  return (
    <IconButton iconProps={{ iconName: "More" }} menuProps={menuProps} menuIconProps={{ hidden: true }}></IconButton>
  );
};
