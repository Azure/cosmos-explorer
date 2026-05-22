import { IconButton } from "@fluentui/react";
import React from "react";
import CopilotCopy from "../../../../../../../../images/CopilotCopy.svg";

export const CopyButton = ({ sqlQuery }: { sqlQuery: string }): JSX.Element => {
  const copyGeneratedCode = (): void => {
    const queryElement = document.createElement("textarea");
    queryElement.value = sqlQuery;
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
