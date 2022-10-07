import { Image, PrimaryButton, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import { sendMessage } from "Common/MessageHandler";
import { configContext } from "ConfigContext";
import { NotebookWorkspaceConnectionInfo } from "Contracts/DataModels";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { QuickstartGuide } from "Explorer/Quickstart/QuickstartGuide";
import React, { useEffect, useState } from "react";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";

interface QuickstartTabProps {
  explorer: Explorer;
}

interface FirewallRule {
  id: string;
  name: string;
  type: string;
  properties: {
    startIpAddress: string;
    endIpAddress: string;
  };
}

export const QuickstartTab: React.FC<QuickstartTabProps> = ({ explorer }: QuickstartTabProps): JSX.Element => {
  const notebookServerInfo = useNotebook((state) => state.notebookServerInfo);
  const [isAllPublicIPAddressEnabled, setIsAllPublicIPAddressEnabled] = useState<boolean>(true);

  const getNotebookServerInfo = (): NotebookWorkspaceConnectionInfo => ({
    authToken: notebookServerInfo.authToken,
    notebookServerEndpoint: `${notebookServerInfo.notebookServerEndpoint?.replace(/\/+$/, "")}/postgresql`,
    forwardingId: notebookServerInfo.forwardingId,
  });

  const checkFirewallRules = async (): Promise<void> => {
    const firewallRulesUri = `${userContext.databaseAccount.id}/firewallRules`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await armRequest({
      host: configContext.ARM_ENDPOINT,
      path: firewallRulesUri,
      method: "GET",
      apiVersion: "2020-10-05-privatepreview",
    });
    const firewallRules: FirewallRule[] = response?.data?.value || response?.value || [];
    const isEnabled = firewallRules.some(
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"
    );
    setIsAllPublicIPAddressEnabled(isEnabled);

    // If the firewall rule is not added, check every 30 seconds to see if the user has added the rule
    if (!isEnabled) {
      setTimeout(checkFirewallRules, 3000);
    }
  };

  useEffect(() => {
    checkFirewallRules();
  });

  useEffect(() => {
    explorer.allocateContainer();
  }, []);

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <QuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {!isAllPublicIPAddressEnabled && (
          <Stack style={{ padding: "16px 20px" }}>
            <Text block>
              To use the PostgreSQL shell, you need to add a firewall rule to allow access from all IP addresses
              (0.0.0.0-255.255.255).
            </Text>
            <Text block>We strongly recommend removing this rule once you finish using the PostgreSQL shell.</Text>
            <Image style={{ margin: "20px 0" }} src="../../../images/firewallRule.png" />
            <PrimaryButton
              style={{ width: 150 }}
              onClick={() => sendMessage({ type: MessageTypes.OpenPostgresNetworkingBlade })}
            >
              Add firewall rule
            </PrimaryButton>
          </Stack>
        )}
        {isAllPublicIPAddressEnabled && notebookServerInfo?.notebookServerEndpoint && (
          <NotebookTerminalComponent
            notebookServerInfo={getNotebookServerInfo()}
            databaseAccount={userContext.databaseAccount}
            tabId="QuickstartPSQLShell"
          />
        )}
        {isAllPublicIPAddressEnabled && !notebookServerInfo?.notebookServerEndpoint && (
          <Spinner styles={{ root: { marginTop: 10 } }} size={SpinnerSize.large}></Spinner>
        )}
      </Stack>
    </Stack>
  );
};
