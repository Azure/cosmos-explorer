import { AuthType } from "../../../AuthType";
import { StyleConstants } from "../../../Common/Constants";
import { DatabaseAccount, Subscription } from "../../../Contracts/DataModels";

import * as React from "react";
import { DefaultButton, IButtonStyles, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { IContextualMenuProps } from "office-ui-fabric-react/lib/ContextualMenu";
import { Dropdown, IDropdownOption, IDropdownProps } from "office-ui-fabric-react/lib/Dropdown";

export interface AccountSwitchComponentProps {
  authType: AuthType;
  selectedAccountName: string;
  accounts: DatabaseAccount[];
  isLoadingAccounts: boolean;
  onAccountChange: (newAccount: DatabaseAccount) => void;
  selectedSubscriptionId: string;
  subscriptions: Subscription[];
  isLoadingSubscriptions: boolean;
  onSubscriptionChange: (newSubscription: Subscription) => void;
  displayText?: string;
}

export class AccountSwitchComponent extends React.Component<AccountSwitchComponentProps> {
  public render(): JSX.Element {
    return this.props.authType === AuthType.AAD ? this._renderSwitchDropDown() : this._renderAccountName();
  }

  private _renderSwitchDropDown(): JSX.Element {
    const { displayText, selectedAccountName } = this.props;

    const menuProps: IContextualMenuProps = {
      directionalHintFixed: true,
      className: "accountSwitchContextualMenu",
      items: [
        {
          key: "switchSubscription",
          onRender: this._renderSubscriptionDropdown.bind(this)
        },
        {
          key: "switchAccount",
          onRender: this._renderAccountDropDown.bind(this)
        }
      ]
    };

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

    const buttonProps: IButtonProps = {
      text: displayText || selectedAccountName,
      menuProps: menuProps,
      styles: buttonStyles,
      className: "accountSwitchButton",
      id: "accountSwitchButton"
    };

    return <DefaultButton {...buttonProps} />;
  }

  private _renderSubscriptionDropdown(): JSX.Element {
    const { subscriptions, selectedSubscriptionId, isLoadingSubscriptions } = this.props;
    const options: IDropdownOption[] = subscriptions.map(sub => {
      return {
        key: sub.subscriptionId,
        text: sub.displayName,
        data: sub
      };
    });

    const placeHolderText = isLoadingSubscriptions
      ? "Loading subscriptions"
      : !options || !options.length
      ? "No subscriptions found in current directory"
      : "Select subscription from list";

    const dropdownProps: IDropdownProps = {
      label: "Subscription",
      className: "accountSwitchSubscriptionDropdown",
      options: options,
      onChange: this._onSubscriptionDropdownChange,
      defaultSelectedKey: selectedSubscriptionId,
      placeholder: placeHolderText,
      styles: {
        callout: "accountSwitchSubscriptionDropdownMenu"
      }
    };

    return <Dropdown {...dropdownProps} />;
  }

  private _onSubscriptionDropdownChange = (e: React.FormEvent<HTMLDivElement>, option: IDropdownOption): void => {
    if (!option) {
      return;
    }

    this.props.onSubscriptionChange(option.data);
  };

  private _renderAccountDropDown(): JSX.Element {
    const { accounts, selectedAccountName, isLoadingAccounts } = this.props;
    const options: IDropdownOption[] = accounts.map(account => {
      return {
        key: account.name,
        text: account.name,
        data: account
      };
    });
    // Fabric UI will also try to select the first non-disabled option from dropdown.
    // Add a option to prevent pop the message when user click on dropdown on first time.
    options.unshift({
      key: "select from list",
      text: "Select Cosmos DB account from list",
      data: undefined
    });

    const placeHolderText = isLoadingAccounts
      ? "Loading Cosmos DB accounts"
      : !options || !options.length
      ? "No Cosmos DB accounts found"
      : "Select Cosmos DB account from list";

    const dropdownProps: IDropdownProps = {
      label: "Cosmos DB Account Name",
      className: "accountSwitchAccountDropdown",
      options: options,
      onChange: this._onAccountDropdownChange,
      defaultSelectedKey: selectedAccountName,
      placeholder: placeHolderText,
      styles: {
        callout: "accountSwitchAccountDropdownMenu"
      }
    };

    return <Dropdown {...dropdownProps} />;
  }

  private _onAccountDropdownChange = (e: React.FormEvent<HTMLDivElement>, option: IDropdownOption): void => {
    if (!option) {
      return;
    }

    this.props.onAccountChange(option.data);
  };

  private _renderAccountName(): JSX.Element {
    const { displayText, selectedAccountName } = this.props;
    return <span className="accountNameHeader">{displayText || selectedAccountName}</span>;
  }
}
