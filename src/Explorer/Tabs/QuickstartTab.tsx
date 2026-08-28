import { Stack } from "@fluentui/react";

import { MessageTypes } from "Contracts/ExplorerContracts";
import { TerminalKind } from "Contracts/ViewModels";
import { QuickstartFirewallNotification } from "Explorer/Quickstart/QuickstartFirewallNotification";
import { QuickstartGuide } from "Explorer/Quickstart/QuickstartGuide";
import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";
import React, { useEffect, useState } from "react";
import FirewallRuleScreenshot from "../../../images/firewallRule.png";

export const QuickstartTab: React.FC = (): JSX.Element => {
  const [isAllPublicIPAddressEnabled, setIsAllPublicIPAddressEnabled] = useState<boolean>(true);

  useEffect(() => {
    checkFirewallRules(
      "2022-11-08",
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
      setIsAllPublicIPAddressEnabled,
    );
  });

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
        {isAllPublicIPAddressEnabled && (
          <CloudShellTerminalComponent
            databaseAccount={userContext.databaseAccount}
            tabId="QuickstartPSQLShell"
            shellType={TerminalKind.Postgres}
          />
        )}
      </Stack>
    </Stack>
  );
};
