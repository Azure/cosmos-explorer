import { IconButton, Image, Stack, Text } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { WelcomeSidecarModal } from "Explorer/QueryCopilot/Modal/WelcomeSidecarModal";
import React from "react";
import CopilotIcon from "../../../images/CopilotSidecarLogo.svg";

interface QueryCopilotSidecarProps {
  explorer: Explorer;
}

export const QueryCopilotSidecar: React.FC<QueryCopilotSidecarProps> = ({
  explorer,
}: QueryCopilotSidecarProps): JSX.Element => {
  return (
    <Stack style={{ width: "320px", height: "800px", backgroundColor: "yellow" }}>
      <Stack style={{ backgroundColor: "#FAFAFA", margin: "15px 0px 0px 0px", padding: "5px" }}>
        <Stack style={{ display: "flex", justifyContent: "space-between" }} horizontal verticalAlign="center">
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
            onClick={() => undefined}
            iconProps={{ iconName: "Cancel" }}
            title="Exit"
            ariaLabel="Exit"
            style={{ color: "#424242", verticalAlign: "middle" }}
          />
        </Stack>
      </Stack>
      <Stack horizontalAlign="center" verticalAlign="center">
        <WelcomeSidecarModal />
      </Stack>
    </Stack>
  );
};
