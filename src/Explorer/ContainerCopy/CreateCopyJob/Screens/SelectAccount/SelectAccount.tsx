import { Stack, Text } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { AccountDropdown } from "./Components/AccountDropdown";
import { MigrationTypeCheckbox } from "./Components/MigrationTypeCheckbox";
import { SubscriptionDropdown } from "./Components/SubscriptionDropdown";

const SelectAccount = React.memo(() => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();

  const handleMigrationTypeChange = (_ev?: React.FormEvent<HTMLElement>, checked?: boolean) => {
    setCopyJobState((prevState) => ({
      ...prevState,
      migrationType: checked ? CopyJobMigrationType.Offline : CopyJobMigrationType.Online,
    }));
  };

  const migrationTypeChecked = copyJobState?.migrationType === CopyJobMigrationType.Offline;

  return (
    <Stack data-test="Panel:SelectAccountContainer" className="selectAccountContainer" tokens={{ childrenGap: 15 }}>
      <Text>{ContainerCopyMessages.selectAccountDescription}</Text>

      <SubscriptionDropdown />

      <AccountDropdown />

      <MigrationTypeCheckbox checked={migrationTypeChecked} onChange={handleMigrationTypeChange} />
    </Stack>
  );
});

SelectAccount.displayName = "SelectAccount";

export default SelectAccount;
