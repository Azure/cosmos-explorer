import { Dropdown } from "@fluentui/react";
import * as React from "react";
import { FunctionComponent } from "react";
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
    <Dropdown
      label="Cosmos DB Account Name"
      className="accountSwitchAccountDropdown"
      options={accounts?.map((account) => ({
        key: account.name,
        text: account.name,
        data: account,
      }))}
      onChange={(_, option) => {
        setSelectedAccountName(String(option?.key));
        dismissMenu();
      }}
      defaultSelectedKey={selectedAccount?.name}
      placeholder={accounts && accounts.length === 0 ? "No Accounts Found" : "Select an Account"}
    />
  );
};
