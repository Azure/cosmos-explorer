/* eslint-disable react/display-name */
import { Stack } from "@fluentui/react";
import React from "react";
import { apiType } from "UserContext";
import { DatabaseAccount, Subscription } from "../../../../../Contracts/DataModels";
import { useDatabaseAccounts } from "../../../../../hooks/useDatabaseAccounts";
import { useSubscriptions } from "../../../../../hooks/useSubscriptions";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums";
import { AccountDropdown } from "./Components/AccountDropdown";
import { MigrationTypeCheckbox } from "./Components/MigrationTypeCheckbox";
import { SubscriptionDropdown } from "./Components/SubscriptionDropdown";
import { useDropdownOptions, useEventHandlers } from "./Utils/selectAccountUtils";

const SelectAccount = React.memo(() => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();
  const selectedSubscriptionId = copyJobState?.source?.subscription?.subscriptionId;

  const subscriptions: Subscription[] = useSubscriptions();
  const allAccounts: DatabaseAccount[] = useDatabaseAccounts(selectedSubscriptionId);
  const sqlApiOnlyAccounts: DatabaseAccount[] = allAccounts?.filter((account) => apiType(account) === "SQL");

  const { subscriptionOptions, accountOptions } = useDropdownOptions(subscriptions, sqlApiOnlyAccounts);
  const { handleSelectSourceAccount, handleMigrationTypeChange } = useEventHandlers(setCopyJobState);

  const migrationTypeChecked = copyJobState?.migrationType === CopyJobMigrationType.Offline;

  return (
    <Stack className="selectAccountContainer" tokens={{ childrenGap: 15 }}>
      <span>{ContainerCopyMessages.selectAccountDescription}</span>

      <SubscriptionDropdown
        options={subscriptionOptions}
        selectedKey={selectedSubscriptionId}
        onChange={(_ev, option) => handleSelectSourceAccount("subscription", option?.data)}
      />

      <AccountDropdown
        options={accountOptions}
        selectedKey={copyJobState?.source?.account?.id}
        disabled={!selectedSubscriptionId}
        onChange={(_ev, option) => handleSelectSourceAccount("account", option?.data)}
      />

      <MigrationTypeCheckbox checked={migrationTypeChecked} onChange={handleMigrationTypeChange} />
    </Stack>
  );
});

export default SelectAccount;
