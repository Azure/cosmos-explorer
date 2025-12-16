/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { Dropdown } from "@fluentui/react";
import { configContext, Platform } from "ConfigContext";
import React, { useEffect } from "react";
import { DatabaseAccount } from "../../../../../../Contracts/DataModels";
import { useDatabaseAccounts } from "../../../../../../hooks/useDatabaseAccounts";
import { apiType, userContext } from "../../../../../../UserContext";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import FieldRow from "../../Components/FieldRow";

interface AccountDropdownProps {}

const normalizeAccountId = (id: string) => {
  if (configContext.platform === Platform.Portal) {
    return id.replace("/Microsoft.DocumentDb/", "/Microsoft.DocumentDB/");
  } else if (configContext.platform === Platform.Hosted) {
    return id.replace("/Microsoft.DocumentDB/", "/Microsoft.DocumentDb/");
  } else {
    return id;
  }
};

export const AccountDropdown: React.FC<AccountDropdownProps> = () => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();

  const selectedSubscriptionId = copyJobState?.source?.subscription?.subscriptionId;
  const allAccounts: DatabaseAccount[] = useDatabaseAccounts(selectedSubscriptionId);
  const sqlApiOnlyAccounts: DatabaseAccount[] = (allAccounts || []).filter((account) => apiType(account) === "SQL");

  const updateCopyJobState = (newAccount: DatabaseAccount) => {
    setCopyJobState((prevState) => {
      if (prevState.source?.account?.id !== newAccount.id) {
        return {
          ...prevState,
          source: {
            ...prevState.source,
            account: newAccount,
          },
        };
      }
      return prevState;
    });
  };

  useEffect(() => {
    if (sqlApiOnlyAccounts && sqlApiOnlyAccounts.length > 0 && selectedSubscriptionId) {
      const currentAccountId = copyJobState?.source?.account?.id;
      const predefinedAccountId = userContext.databaseAccount?.id;
      const selectedAccountId = currentAccountId || predefinedAccountId;

      const targetAccount: DatabaseAccount | null =
        sqlApiOnlyAccounts.find((account) => account.id === selectedAccountId) || null;
      updateCopyJobState(targetAccount || sqlApiOnlyAccounts[0]);
    }
  }, [sqlApiOnlyAccounts?.length, selectedSubscriptionId]);

  const accountOptions =
    sqlApiOnlyAccounts?.map((account) => ({
      key: normalizeAccountId(account.id),
      text: account.name,
      data: account,
    })) || [];

  const handleAccountChange = (_ev?: React.FormEvent, option?: (typeof accountOptions)[0]) => {
    const selectedAccount = option?.data as DatabaseAccount;

    if (selectedAccount) {
      updateCopyJobState(selectedAccount);
    }
  };

  const isAccountDropdownDisabled = !selectedSubscriptionId || accountOptions.length === 0;
  const selectedAccountId = normalizeAccountId(copyJobState?.source?.account?.id ?? "");

  return (
    <FieldRow label={ContainerCopyMessages.sourceAccountDropdownLabel}>
      <Dropdown
        placeholder={ContainerCopyMessages.sourceAccountDropdownPlaceholder}
        ariaLabel={ContainerCopyMessages.sourceAccountDropdownLabel}
        options={accountOptions}
        disabled={isAccountDropdownDisabled}
        required
        selectedKey={selectedAccountId}
        onChange={handleAccountChange}
        data-test="account-dropdown"
      />
    </FieldRow>
  );
};
