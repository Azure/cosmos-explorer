import { Dropdown } from "@fluentui/react";
import * as React from "react";
import { FunctionComponent } from "react";
import { Subscription } from "../../../Contracts/DataModels";

interface Props {
  subscriptions: Subscription[];
  selectedSubscription: Subscription;
  setSelectedSubscriptionId: (id: string) => void;
}

export const SwitchSubscription: FunctionComponent<Props> = ({
  subscriptions,
  setSelectedSubscriptionId,
  selectedSubscription,
}: Props) => {
  return (
    <Dropdown
      label="Subscription"
      className="accountSwitchSubscriptionDropdown"
      options={subscriptions?.map((sub) => {
        return {
          key: sub.subscriptionId,
          text: sub.displayName,
          data: sub,
        };
      })}
      onChange={(_, option) => {
        setSelectedSubscriptionId(String(option?.key));
      }}
      defaultSelectedKey={selectedSubscription?.subscriptionId}
      placeholder={subscriptions && subscriptions.length === 0 ? "No Subscriptions Found" : "Select a Subscription"}
    />
  );
};
