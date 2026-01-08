import * as React from "react";
import { FunctionComponent } from "react";
import { SearchableDropdown } from "../../../Common/SearchableDropdown";
import { DatabaseAccount } from "../../../Contracts/DataModels";

interface Props {
  accounts: DatabaseAccount[];
  selectedAccount: DatabaseAccount;
  setSelectedAccountName: (id: string) => void;
  dismissMenu: () => void;
}

export const SwitchAccount: FunctionComponent<Props> = ({
  accounts,
  setSelectedAccountName,
  selectedAccount,
  dismissMenu,
}: Props) => {
  return (
    <SearchableDropdown<DatabaseAccount>
      label="Cosmos DB Account Name"
      items={accounts}
      selectedItem={selectedAccount}
      onSelect={(account) => setSelectedAccountName(account.name)}
      getKey={(account) => account.name}
      getDisplayText={(account) => account.name}
      placeholder="Select an Account"
      filterPlaceholder="Filter accounts"
      className="accountSwitchAccountDropdown"
      disabled={!accounts || accounts.length === 0}
      onDismiss={dismissMenu}
    />
  );
};
