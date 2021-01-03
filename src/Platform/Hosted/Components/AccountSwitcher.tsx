import { StyleConstants } from "../../../Common/Constants";
import * as React from "react";
import { DefaultButton, IButtonStyles } from "office-ui-fabric-react/lib/Button";
import { IContextualMenuProps } from "office-ui-fabric-react/lib/ContextualMenu";
import { Dropdown, IDropdownProps } from "office-ui-fabric-react/lib/Dropdown";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { useDatabaseAccounts } from "../../../hooks/useDatabaseAccounts";
import { DatabaseAccount } from "../../../Contracts/DataModels";

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

export const AccountSwitcher: React.FunctionComponent<Props> = ({ armToken, setDatabaseAccount }: Props) => {
  const subscriptions = useSubscriptions(armToken);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = React.useState<string>(cachedSubscriptionId);
  const accounts = useDatabaseAccounts(selectedSubscriptionId, armToken);
  const [selectedAccountName, setSelectedAccoutName] = React.useState<string>(cachedDatabaseAccountName);

  React.useEffect(() => {
    if (accounts && selectedAccountName) {
      const account = accounts.find(account => account.name === selectedAccountName);
      // Only set a new account if one is found
      if (account) {
        setDatabaseAccount(account);
      }
    }
  }, [accounts, selectedAccountName]);

  const menuProps: IContextualMenuProps = {
    directionalHintFixed: true,
    className: "accountSwitchContextualMenu",
    items: [
      {
        key: "switchSubscription",
        onRender: () => {
          // const placeHolderText = isLoadingSubscriptions
          //   ? "Loading subscriptions"
          //   : !options || !options.length
          //   ? "No subscriptions found in current directory"
          //   : "Select subscription from list";

          const dropdownProps: IDropdownProps = {
            label: "Subscription",
            className: "accountSwitchSubscriptionDropdown",
            options: subscriptions.map(sub => {
              return {
                key: sub.subscriptionId,
                text: sub.displayName,
                data: sub
              };
            }),
            onChange: (event, option) => {
              const subscriptionId = String(option.key);
              setSelectedSubscriptionId(subscriptionId);
              localStorage.setItem("cachedSubscriptionId", subscriptionId);
            },
            defaultSelectedKey: selectedSubscriptionId,
            placeholder: "Select subscription from list",
            styles: {
              callout: "accountSwitchSubscriptionDropdownMenu"
            }
          };

          return <Dropdown {...dropdownProps} />;
        }
      },
      {
        key: "switchAccount",
        onRender: (item, dismissMenu) => {
          // const placeHolderText = isLoadingAccounts
          //   ? "Loading Cosmos DB accounts"
          //   : !options || !options.length
          //   ? "No Cosmos DB accounts found"
          //   : "Select Cosmos DB account from list";

          const dropdownProps: IDropdownProps = {
            label: "Cosmos DB Account Name",
            className: "accountSwitchAccountDropdown",
            options: accounts.map(account => ({
              key: account.name,
              text: account.name,
              data: account
            })),
            onChange: (event, option) => {
              const accountName = String(option.key);
              setSelectedAccoutName(String(option.key));
              localStorage.setItem("cachedDatabaseAccountName", accountName);
              dismissMenu();
            },
            defaultSelectedKey: selectedAccountName,
            placeholder: "No Cosmos DB accounts found",
            styles: {
              callout: "accountSwitchAccountDropdownMenu"
            }
          };

          return <Dropdown {...dropdownProps} />;
        }
      }
    ]
  };

  return (
    <DefaultButton
      text={selectedAccountName || "Select Database Account"}
      menuProps={menuProps}
      styles={buttonStyles}
      className="accountSwitchButton"
      id="accountSwitchButton"
    />
  );
};
