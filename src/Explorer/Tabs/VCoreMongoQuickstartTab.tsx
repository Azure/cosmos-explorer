import { Stack } from "@fluentui/react";

import { TerminalKind } from "Contracts/ViewModels";
import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import { VcoreMongoQuickstartGuide } from "Explorer/Quickstart/VCoreMongoQuickstartGuide";
import { userContext } from "UserContext";
import React from "react";

export const VcoreMongoQuickstartTab: React.FC = (): JSX.Element => {
  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <VcoreMongoQuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        <CloudShellTerminalComponent
          databaseAccount={userContext.databaseAccount}
          tabId="QuickstartVcoreMongoShell"
          username={userContext.vcoreMongoConnectionParams?.adminLogin}
          shellType={TerminalKind.VCoreMongo}
        />
      </Stack>
    </Stack>
  );
};
