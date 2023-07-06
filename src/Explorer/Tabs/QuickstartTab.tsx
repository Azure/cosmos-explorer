import { Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import { configContext } from "ConfigContext";
import { NotebookWorkspaceConnectionInfo, PostgresFirewallRule } from "Contracts/DataModels";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { QuickstartGuide } from "Explorer/Quickstart/QuickstartGuide";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import React, { useEffect, useState } from "react";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";

interface QuickstartTabProps {
  explorer: Explorer;
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
      apiVersion: "2022-11-08",
    });
    const firewallRules: PostgresFirewallRule[] = response?.data?.value || response?.value || [];
    const isEnabled = firewallRules.some(
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"
    );
    setIsAllPublicIPAddressEnabled(isEnabled);

    // If the firewall rule is not added, check every 30 seconds to see if the user has added the rule
    if (!isEnabled && useTabs.getState().activeReactTab === ReactTabKind.Quickstart) {
      setTimeout(checkFirewallRules, 30000);
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
        {!isAllPublicIPAddressEnabled && <QuickstartFirewallNotification />}
        {isAllPublicIPAddressEnabled && notebookServerInfo?.notebookServerEndpoint && (
          <NotebookTerminalComponent
            notebookServerInfo={getNotebookServerInfo()}
            databaseAccount={userContext.databaseAccount}
            tabId="QuickstartPSQLShell"
          />
        )}
        {isAllPublicIPAddressEnabled && !notebookServerInfo?.notebookServerEndpoint && (
          <Stack style={{ margin: "auto 0" }}>
            <Text block style={{ margin: "auto" }}>
              Connecting to the PostgreSQL shell.
            </Text>
            <Text block style={{ margin: "auto" }}>
              If the cluster was just created, this could take up to a minute.
            </Text>
            <Spinner styles={{ root: { marginTop: 16 } }} size={SpinnerSize.large}></Spinner>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
