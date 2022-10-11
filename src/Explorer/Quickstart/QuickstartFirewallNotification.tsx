import { Image, PrimaryButton, Stack, Text } from "@fluentui/react";
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import React from "react";
import FirewallRuleScreenshot from "../../../images/firewallRule.png";

export const QuickstartFirewallNotification: React.FC = (): JSX.Element => (
  <Stack style={{ padding: "16px 20px" }}>
    <Text block>
      To use the PostgreSQL shell, you need to add a firewall rule to allow access from all IP addresses
      (0.0.0.0-255.255.255).
    </Text>
    <Text block>We strongly recommend removing this rule once you finish using the PostgreSQL shell.</Text>
    <Image style={{ margin: "20px 0" }} src={FirewallRuleScreenshot} />
    <PrimaryButton
      style={{ width: 150 }}
      onClick={() => sendMessage({ type: MessageTypes.OpenPostgresNetworkingBlade })}
    >
      Add firewall rule
    </PrimaryButton>
  </Stack>
);
