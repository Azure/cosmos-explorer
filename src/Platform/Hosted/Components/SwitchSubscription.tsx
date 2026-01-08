import * as React from "react";
import { FunctionComponent } from "react";
import { SearchableDropdown } from "../../../Common/SearchableDropdown";
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
    <SearchableDropdown<Subscription>
      label="Subscription"
      items={subscriptions}
      selectedItem={selectedSubscription}
      onSelect={(sub) => setSelectedSubscriptionId(sub.subscriptionId)}
      getKey={(sub) => sub.subscriptionId}
      getDisplayText={(sub) => sub.displayName}
      placeholder="Select a Subscription"
      filterPlaceholder="Filter subscriptions"
      className="accountSwitchSubscriptionDropdown"
    />
  );
};
