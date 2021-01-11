// TODO: Renable this rule for the file or turn it off everywhere
/* eslint-disable react/display-name */

import { StyleConstants } from "../../../Common/Constants";
import * as React from "react";
import { DefaultButton, IButtonStyles } from "office-ui-fabric-react/lib/Button";
import { IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu";
import { Dropdown } from "office-ui-fabric-react/lib/Dropdown";
import { fetchDatabaseAccounts } from "../../../hooks/useDatabaseAccounts";
import { DatabaseAccount, Subscription } from "../../../Contracts/DataModels";
import useSWR from "swr";
import { fetchSubscriptions } from "../../../hooks/useSubscriptions";

const buttonStyles: IButtonStyles = {
  root: {
    fontSize: StyleConstants.DefaultFontSize,
    height: 40,
    padding: 0,
    paddingLeft: 10,
    marginRight: 5,
    backgroundColor: StyleConstants.BaseDark,
    color: StyleConstants.BaseLight
  },
  rootHovered: {
    backgroundColor: StyleConstants.BaseHigh,
    color: StyleConstants.BaseLight
  },
  rootFocused: {
    backgroundColor: StyleConstants.BaseHigh,
    color: StyleConstants.BaseLight
  },
  rootPressed: {
    backgroundColor: StyleConstants.BaseHigh,
    color: StyleConstants.BaseLight
  },
  rootExpanded: {
    backgroundColor: StyleConstants.BaseHigh,
    color: StyleConstants.BaseLight
  },
  textContainer: {
    flexGrow: "initial"
  }
};

const cachedSubscriptionId = localStorage.getItem("cachedSubscriptionId");
const cachedDatabaseAccountName = localStorage.getItem("cachedDatabaseAccountName");

interface Props {
  armToken: string;
  setDatabaseAccount: (account: DatabaseAccount) => void;
}

const useSubscriptions = (armToken: string): Subscription[] | undefined => {
  const { data } = useSWR(
    () => (armToken ? ["subscriptions", armToken] : undefined),
    (_, armToken) => fetchSubscriptions(armToken)
  );
  return data;
};

const useDatabaseAccounts = (subscriptionId: string, armToken: string): DatabaseAccount[] | undefined => {
  const { data } = useSWR(
    () => (armToken && subscriptionId ? ["databaseAccounts", subscriptionId, armToken] : undefined),
    (_, subscriptionId, armToken) => fetchDatabaseAccounts([subscriptionId], armToken)
  );
  return data;
};

export const AccountSwitcher: React.FunctionComponent<Props> = ({ armToken, setDatabaseAccount }: Props) => {
  const subscriptions = useSubscriptions(armToken);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = React.useState<string>(cachedSubscriptionId);
  const selectedSubscription = subscriptions?.find(sub => sub.subscriptionId === selectedSubscriptionId);
  const accounts = useDatabaseAccounts(selectedSubscription?.subscriptionId, armToken);
  const [selectedAccountName, setSelectedAccoutName] = React.useState<string>(cachedDatabaseAccountName);
  const selectedAccount = accounts?.find(account => account.name === selectedAccountName);

  React.useEffect(() => {
    if (selectedAccountName) {
      localStorage.setItem("cachedDatabaseAccountName", selectedAccountName);
    }
  }, [selectedAccountName]);

  React.useEffect(() => {
    if (selectedSubscriptionId) {
      localStorage.setItem("cachedSubscriptionId", selectedSubscriptionId);
    }
  }, [selectedSubscriptionId]);

  React.useEffect(() => {
    if (selectedAccount) {
      setDatabaseAccount(selectedAccount);
    }
  }, [selectedAccount]);

  const buttonText = selectedAccount?.name || "Select a Database Account";

  const items: IContextualMenuItem[] = [
    {
      key: "switchSubscription",
      onRender: () => (
        <Dropdown
          label="Subscription"
          className="accountSwitchSubscriptionDropdown"
          options={subscriptions?.map(sub => {
            return {
              key: sub.subscriptionId,
              text: sub.displayName,
              data: sub
            };
          })}
          onChange={(_, option) => {
            setSelectedSubscriptionId(String(option.key));
          }}
          defaultSelectedKey={selectedSubscription?.subscriptionId}
          placeholder={subscriptions && subscriptions.length === 0 ? "No Subscriptions Found" : "Loading ..."}
          styles={{
            callout: "accountSwitchSubscriptionDropdownMenu"
          }}
        />
      )
    },
    {
      key: "switchAccount",
      onRender: (_, dismissMenu) => (
        <Dropdown
          label="Cosmos DB Account Name"
          className="accountSwitchAccountDropdown"
          options={accounts?.map(account => ({
            key: account.name,
            text: account.name,
            data: account
          }))}
          onChange={(_, option) => {
            setSelectedAccoutName(String(option.key));
            dismissMenu();
          }}
          defaultSelectedKey={selectedAccount?.name}
          placeholder={accounts && accounts.length === 0 ? "No Accounts Found" : "Select an Account"}
          styles={{
            callout: "accountSwitchAccountDropdownMenu"
          }}
        />
      )
    }
  ];

  return (
    <DefaultButton
      text={buttonText}
      menuProps={{
        directionalHintFixed: true,
        className: "accountSwitchContextualMenu",
        items
      }}
      styles={buttonStyles}
      className="accountSwitchButton"
      id="accountSwitchButton"
    />
  );
};
