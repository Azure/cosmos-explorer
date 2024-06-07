import { PrimaryButton, Stack, Text } from "@fluentui/react";
import { AuthType } from "AuthType";
import { configContext } from "ConfigContext";
import { userContext } from "UserContext";
import * as React from "react";

export const OpenFullScreen: React.FunctionComponent = () => {
  const searchParams = new URLSearchParams();
  searchParams.append("openFrom", "portal");

  let hasAccountContext = false;
  let requiresConnectionString = false;

  if (userContext.authType === AuthType.AAD) {
    if (userContext.subscriptionId && userContext.databaseAccount) {
      searchParams.append("subscription", userContext.subscriptionId);
      searchParams.append("account", userContext.databaseAccount.name);
      searchParams.append("authType", "entra");
      hasAccountContext = true;
    }
  } else if (userContext.authType === AuthType.MasterKey || userContext.authType === AuthType.ResourceToken) {
    requiresConnectionString = true;
  }

  return (
    <>
      <div style={{ padding: "34px" }}>
        <Stack tokens={{ childrenGap: 10 }}>
          <Text>
            Open this database account in a new browser tab with Cosmos DB Explorer.
            {requiresConnectionString && " You'll need to provide a connection string."}
            {hasAccountContext && " You may be prompted to sign in with Entra ID again."}
          </Text>
          <Text>
            Open tabs and queries will not be carried over, but you can still access them in this tab.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              href={`${configContext.hostedExplorerURL}?${searchParams.toString()}`}
              target="_blank"
              text="Open"
              iconProps={{ iconName: "OpenInNewWindow" }}
            />
          </Stack>
        </Stack>
      </div>
    </>
  );
};
