import { IconButton } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import CopilotCopy from "../../../../../../../../images/CopilotCopy.svg";

export const CopyButton: React.FC = (): JSX.Element => {
  const copyGeneratedCode = (): void => {
    const queryElement = document.createElement("textarea");
    queryElement.value = useQueryCopilot.getState().generatedQuery;
    document.body.appendChild(queryElement);
    queryElement.select();
    document.execCommand("copy");
    document.body.removeChild(queryElement);
  };

  return (
    <IconButton
      iconProps={{ imageProps: { src: CopilotCopy } }}
      ariaLabel="Copy"
      onClick={copyGeneratedCode}
    ></IconButton>
  );
};
