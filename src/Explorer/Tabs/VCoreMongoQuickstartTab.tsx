import { Stack } from "@fluentui/react";

import { MessageTypes } from "Contracts/ExplorerContracts";
import { TerminalKind } from "Contracts/ViewModels";
import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { VcoreMongoQuickstartGuide } from "Explorer/Quickstart/VCoreMongoQuickstartGuide";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";
import React, { useEffect, useState } from "react";
import FirewallRuleScreenshot from "../../../images/vcoreMongoFirewallRule.png";

export const VcoreMongoQuickstartTab: React.FC = (): JSX.Element => {
  const [isAllPublicIPAddressEnabled, setIsAllPublicIPAddressEnabled] = useState<boolean>(true);

  useEffect(() => {
    checkFirewallRules(
      "2023-03-01-preview",
      (rule) =>
        rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
        (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"),
      setIsAllPublicIPAddressEnabled,
    );
  });

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <VcoreMongoQuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {!isAllPublicIPAddressEnabled && (
          <QuickstartFirewallNotification
            messageType={MessageTypes.OpenVCoreMongoNetworkingBlade}
            screenshot={FirewallRuleScreenshot}
            shellName="MongoDB"
          />
        )}
        {isAllPublicIPAddressEnabled && (
          <CloudShellTerminalComponent
            databaseAccount={userContext.databaseAccount}
            tabId="QuickstartVcoreMongoShell"
            username={userContext.vcoreMongoConnectionParams?.adminLogin}
            shellType={TerminalKind.VCoreMongo}
          />
        )}
      </Stack>
    </Stack>
  );
};
