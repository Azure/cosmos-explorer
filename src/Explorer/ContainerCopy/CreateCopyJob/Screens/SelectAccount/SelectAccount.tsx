import { Stack, Text } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { AccountDropdown } from "./Components/AccountDropdown";
import { MigrationType } from "./Components/MigrationType";
import { SubscriptionDropdown } from "./Components/SubscriptionDropdown";

const SelectAccount = React.memo(() => {
  return (
    <Stack data-test="Panel:SelectAccountContainer" className="selectAccountContainer" tokens={{ childrenGap: 15 }}>
      <Text className="themeText">{ContainerCopyMessages.selectAccountDescription}</Text>

      <SubscriptionDropdown />

      <AccountDropdown />

      <MigrationType />
    </Stack>
  );
});

SelectAccount.displayName = "SelectAccount";

export default SelectAccount;
