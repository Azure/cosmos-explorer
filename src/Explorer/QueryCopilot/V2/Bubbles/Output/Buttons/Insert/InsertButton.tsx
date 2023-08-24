import { ActionButton } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import CopilotInsert from "../../../../../../../../images/CopilotInsert.svg";

export const InsertButton: React.FC = (): JSX.Element => {
  return (
    <ActionButton
      iconProps={{ imageProps: { src: CopilotInsert } }}
      style={{ borderRadius: "4px", borderWidth: "1px", borderColor: "#D1D1D1", height: "24px", paddingBottom: "2px" }}
      onClick={() => useQueryCopilot.getState().setQuery(useQueryCopilot.getState().generatedQuery)}
    >
      Insert
    </ActionButton>
  );
};
