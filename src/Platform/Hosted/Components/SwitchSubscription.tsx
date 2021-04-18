import React from "react";
import { Subscription } from "../../../Contracts/DataModels";
import { DropdownItem, SearchableDropdown } from "./SearchableDropdown";

interface Props {
  subscriptions: Subscription[];
  selectedSubscription: Subscription;
  setSelectedSubscriptionId: (id: string) => void;
}

export const SwitchSubscription: React.FunctionComponent<Props> = ({
  subscriptions,
  setSelectedSubscriptionId,
  selectedSubscription,
}: Props) => {
  const subscriptionItems = subscriptions?.map((sub) => ({
    key: sub.subscriptionId,
    text: sub.displayName,
  }));

  const defaultSubscription = selectedSubscription && {
    key: selectedSubscription.subscriptionId,
    text: selectedSubscription.displayName,
  };

  return (
    <SearchableDropdown
      items={subscriptionItems}
      title="Subscription"
      defaultSelectedItem={defaultSubscription}
      placeholder={subscriptions?.length === 0 ? "No Subscriptions Found" : "Select a Subscription"}
      onItemSelected={(subscriptionItem: DropdownItem) => setSelectedSubscriptionId(subscriptionItem.key)}
    />
  );
};
