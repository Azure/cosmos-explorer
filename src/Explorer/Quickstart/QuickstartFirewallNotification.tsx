import { Image, PrimaryButton, Stack, Text } from "@fluentui/react";
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import React from "react";

export interface QuickstartFirewallNotificationProps {
  shellName: string;
  screenshot: string;
  messageType: MessageTypes;
}

export const QuickstartFirewallNotification: React.FC<QuickstartFirewallNotificationProps> = ({
  shellName,
  screenshot,
  messageType,
}: QuickstartFirewallNotificationProps): JSX.Element => (
  <Stack style={{ padding: "16px 20px" }}>
    <Text block>
      To use the {shellName} shell, you need to add a firewall rule to allow access from all IP addresses
      (0.0.0.0-255.255.255).
    </Text>
    <Text block>We strongly recommend removing this rule once you finish using the {shellName} shell.</Text>
    <Image style={{ margin: "20px 0" }} src={screenshot} />
    <PrimaryButton style={{ width: 150 }} onClick={() => sendMessage({ type: messageType })}>
      Add firewall rule
    </PrimaryButton>
  </Stack>
);
