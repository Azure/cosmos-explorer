import { Link, MessageBar, MessageBarType, Stack, Text } from "@fluentui/react";

import { TerminalKind } from "Contracts/ViewModels";
import { VcoreMongoQuickstartGuide } from "Explorer/Quickstart/VCoreMongoQuickstartGuide";
import { CloudShellTerminalComponent } from "Explorer/Tabs/CloudShellTab/CloudShellTerminalComponent";
import {
  isVCoreMongoNativeAuthDisabled,
  userContext,
  VCoreMongoNativeAuthDisabledMessage,
  VCoreMongoNativeAuthLearnMoreUrl,
} from "UserContext";
import React from "react";

export const VcoreMongoQuickstartTab: React.FC = (): JSX.Element => {
  const isNativeAuthDisabled = isVCoreMongoNativeAuthDisabled();

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <VcoreMongoQuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {isNativeAuthDisabled ? (
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
        ) : (
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
