import { Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import { PoolIdType } from "Common/Constants";
import { NotebookWorkspaceConnectionInfo } from "Contracts/DataModels";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { QuickstartGuide } from "Explorer/Quickstart/QuickstartGuide";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";
import React, { useEffect, useState } from "react";
import FirewallRuleScreenshot from "../../../images/firewallRule.png";

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

  useEffect(() => {
    checkFirewallRules(
      "2022-11-08",
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
      setIsAllPublicIPAddressEnabled
    );
  });

  useEffect(() => {
    explorer.allocateContainer(PoolIdType.DefaultPoolId);
  }, []);

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <QuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {!isAllPublicIPAddressEnabled && (
          <QuickstartFirewallNotification
            messageType={MessageTypes.OpenPostgresNetworkingBlade}
            screenshot={FirewallRuleScreenshot}
            shellName="PostgreSQL"
          />
        )}
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
