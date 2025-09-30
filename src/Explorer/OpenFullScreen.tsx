import { PrimaryButton, Stack, Text } from "@fluentui/react";
import * as React from "react";

export const OpenFullScreen: React.FunctionComponent = () => {
  return (
    <>
      <div style={{ padding: "34px" }}>
        <Stack tokens={{ childrenGap: 10 }}>
          <Text style={{ color: "var(--colorNeutralForeground1)" }}>
            Open this database account in a new browser tab with Cosmos DB Explorer. You can connect using your
            Microsoft account or a connection string.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              onClick={() => {
                window.open("https://cosmos.azure.com/", "_blank");
              }}
              text="Open"
              iconProps={{ iconName: "OpenInNewWindow" }}
            />
          </Stack>
        </Stack>
      </div>
    </>
  );
};
