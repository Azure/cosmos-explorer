import { Link, MessageBar, MessageBarType, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import { PoolIdType } from "Common/Constants";
import { NotebookWorkspaceConnectionInfo } from "Contracts/DataModels";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { VcoreMongoQuickstartGuide } from "Explorer/Quickstart/VCoreMongoQuickstartGuide";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import {
  isVCoreMongoNativeAuthDisabled,
  userContext,
  VCoreMongoNativeAuthDisabledMessage,
  VCoreMongoNativeAuthLearnMoreUrl,
} from "UserContext";
import React, { useEffect, useState } from "react";
import FirewallRuleScreenshot from "../../../images/vcoreMongoFirewallRule.png";

interface VCoreMongoQuickstartTabProps {
  explorer: Explorer;
}

export const VcoreMongoQuickstartTab: React.FC<VCoreMongoQuickstartTabProps> = ({
  explorer,
}: VCoreMongoQuickstartTabProps): JSX.Element => {
  const notebookServerInfo = useNotebook((state) => state.notebookServerInfo);
  const [isAllPublicIPAddressEnabled, setIsAllPublicIPAddressEnabled] = useState<boolean>(true);
  const isNativeAuthDisabled = isVCoreMongoNativeAuthDisabled();

  const getNotebookServerInfo = (): NotebookWorkspaceConnectionInfo => ({
    authToken: notebookServerInfo.authToken,
    notebookServerEndpoint: `${notebookServerInfo.notebookServerEndpoint?.replace(/\/+$/, "")}/mongovcore`,
    forwardingId: notebookServerInfo.forwardingId,
  });

  useEffect(() => {
    checkFirewallRules(
      "2023-03-01-preview",
      (rule) =>
        rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
        (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"),
      setIsAllPublicIPAddressEnabled,
    );
  });

  useEffect(() => {
    explorer.allocateContainer(PoolIdType.DefaultPoolId);
  }, []);

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <VcoreMongoQuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {isNativeAuthDisabled && (
          <Stack style={{ margin: "auto", padding: 20 }}>
            <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
              <Text>
                {VCoreMongoNativeAuthDisabledMessage}{" "}
                <Link href={VCoreMongoNativeAuthLearnMoreUrl} target="_blank">
                  Learn more
                </Link>
              </Text>
            </MessageBar>
          </Stack>
        )}
        {!isNativeAuthDisabled && !isAllPublicIPAddressEnabled && (
          <QuickstartFirewallNotification
            messageType={MessageTypes.OpenVCoreMongoNetworkingBlade}
            screenshot={FirewallRuleScreenshot}
            shellName="MongoDB"
          />
        )}
        {!isNativeAuthDisabled && isAllPublicIPAddressEnabled && notebookServerInfo?.notebookServerEndpoint && (
          <NotebookTerminalComponent
            notebookServerInfo={getNotebookServerInfo()}
            databaseAccount={userContext.databaseAccount}
            tabId="QuickstartVcoreMongoShell"
            username={userContext.vcoreMongoConnectionParams.adminLogin}
          />
        )}
        {!isNativeAuthDisabled && isAllPublicIPAddressEnabled && !notebookServerInfo?.notebookServerEndpoint && (
          <Stack style={{ margin: "auto 0" }}>
            <Text block style={{ margin: "auto" }}>
              Connecting to the Mongo shell.
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
