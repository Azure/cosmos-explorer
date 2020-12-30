import { StyleConstants } from "../../../Common/Constants";
import { DatabaseAccount, Subscription } from "../../../Contracts/DataModels";

import * as React from "react";
import { DefaultButton, IButtonStyles, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { IContextualMenuProps } from "office-ui-fabric-react/lib/ContextualMenu";
import { Dropdown, IDropdownOption, IDropdownProps } from "office-ui-fabric-react/lib/Dropdown";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { useDatabaseAccounts } from "../../../hooks/useDatabaseAccounts";

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

export const AccountSwitchComponent: React.FunctionComponent = () => {
  const subscriptions = useSubscriptions();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = React.useState<string>();
  const accounts = useDatabaseAccounts(selectedSubscriptionId);
  const [selectedAccountName, setSelectedAccoutName] = React.useState<string>();

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
              setSelectedSubscriptionId(String(option.key));
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
        onRender: () => {
          const isLoadingAccounts = false;

          const options = accounts.map(account => ({
            key: account.name,
            text: account.name,
            data: account
          }));

          const placeHolderText = isLoadingAccounts
            ? "Loading Cosmos DB accounts"
            : !options || !options.length
            ? "No Cosmos DB accounts found"
            : "Select Cosmos DB account from list";

          const dropdownProps: IDropdownProps = {
            label: "Cosmos DB Account Name",
            className: "accountSwitchAccountDropdown",
            options,
            onChange: (event, option) => {
              setSelectedAccoutName(String(option.key));
            },
            defaultSelectedKey: selectedAccountName,
            placeholder: placeHolderText,
            styles: {
              callout: "accountSwitchAccountDropdownMenu"
            }
          };

          return <Dropdown {...dropdownProps} />;
        }
      }
    ]
  };

  const buttonProps: IButtonProps = {
    text: selectedAccountName || "Select Database Account",
    menuProps: menuProps,
    styles: buttonStyles,
    className: "accountSwitchButton",
    id: "accountSwitchButton"
  };

  return <DefaultButton {...buttonProps} />;
};
