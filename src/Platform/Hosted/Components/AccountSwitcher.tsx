// TODO: Renable this rule for the file or turn it off everywhere
/* eslint-disable react/display-name */

import { StyleConstants } from "../../../Common/Constants";
import { FunctionComponent, useState, useEffect } from "react";
import * as React from "react";
import { DefaultButton, IButtonStyles } from "office-ui-fabric-react/lib/Button";
import { IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { useDatabaseAccounts } from "../../../hooks/useDatabaseAccounts";
import { SwitchSubscription } from "./SwitchSubscription";
import { SwitchAccount } from "./SwitchAccount";

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

interface Props {
  armToken: string;
  setDatabaseAccount: (account: DatabaseAccount) => void;
}

export const AccountSwitcher: FunctionComponent<Props> = ({ armToken, setDatabaseAccount }: Props) => {
  const subscriptions = useSubscriptions(armToken);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>(() =>
    localStorage.getItem("cachedSubscriptionId")
  );
  const selectedSubscription = subscriptions?.find(sub => sub.subscriptionId === selectedSubscriptionId);
  const accounts = useDatabaseAccounts(selectedSubscription?.subscriptionId, armToken);
  const [selectedAccountName, setSelectedAccountName] = useState<string>(() =>
    localStorage.getItem("cachedDatabaseAccountName")
  );
  const selectedAccount = accounts?.find(account => account.name === selectedAccountName);

  useEffect(() => {
    if (selectedAccountName) {
      localStorage.setItem("cachedDatabaseAccountName", selectedAccountName);
    }
  }, [selectedAccountName]);

  useEffect(() => {
    if (selectedSubscriptionId) {
      localStorage.setItem("cachedSubscriptionId", selectedSubscriptionId);
    }
  }, [selectedSubscriptionId]);

  useEffect(() => {
    if (selectedAccount) {
      setDatabaseAccount(selectedAccount);
    }
  }, [selectedAccount]);

  const buttonText = selectedAccount?.name || "Select a Database Account";

  const items: IContextualMenuItem[] = [
    {
      key: "switchSubscription",
      onRender: () => <SwitchSubscription {...{ subscriptions, setSelectedSubscriptionId, selectedSubscription }} />
    },
    {
      key: "switchAccount",
      onRender: (_, dismissMenu) => (
        <SwitchAccount {...{ accounts, dismissMenu, selectedAccount, setSelectedAccountName }} />
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
