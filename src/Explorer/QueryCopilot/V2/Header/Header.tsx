import { IconButton, Image, Stack, Text } from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import CopilotIcon from "../../../../../images/CopilotSidebarLogo.svg";

export const Header: React.FC = (): JSX.Element => {
  const { setShowCopilotSidebar } = useQueryCopilot();

  return (
    <Stack
      style={{ margin: "15px 0px 0px 0px", padding: "5px", display: "flex", justifyContent: "space-between" }}
      horizontal
      verticalAlign="center"
    >
      <Stack horizontal verticalAlign="center">
        <Image src={CopilotIcon} />
        <Text style={{ marginLeft: "5px", fontWeight: "bold" }}>Copilot</Text>
        <Text
          style={{
            background: "#f0f0f0",
            fontSize: "10px",
            padding: "2px 4px",
            marginLeft: "5px",
            borderRadius: "8px",
          }}
        >
          Preview
        </Text>
      </Stack>
      <IconButton
        onClick={() => setShowCopilotSidebar(false)}
        iconProps={{ iconName: "Cancel" }}
        title="Exit"
        ariaLabel="Exit"
        style={{ color: "#424242", verticalAlign: "middle" }}
      />
    </Stack>
  );
};
