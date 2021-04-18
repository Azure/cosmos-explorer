import React from "react";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { DropdownItem, SearchableDropdown } from "./SearchableDropdown";

interface Props {
  accounts: DatabaseAccount[];
  selectedAccount: DatabaseAccount;
  setSelectedAccountName: (id: string) => void;
  dismissMenu: () => void;
}

export const SwitchAccount: React.FunctionComponent<Props> = ({
  accounts,
  setSelectedAccountName,
  selectedAccount,
  dismissMenu,
}: Props) => {
  const accountItems = accounts?.map((account) => ({
    key: account.name,
    text: account.name,
  }));

  const defaultAccount = selectedAccount && {
    key: selectedAccount.name,
    text: selectedAccount.name,
  };

  return (
    <SearchableDropdown
      items={accountItems}
      title="Cosmos DB Account Name"
      defaultSelectedItem={defaultAccount}
      placeholder={accounts?.length === 0 ? "No Accounts Found" : "Select an Account"}
      onItemSelected={(accountItem: DropdownItem) => {
        setSelectedAccountName(accountItem.key);
        dismissMenu();
      }}
    />
  );
};
