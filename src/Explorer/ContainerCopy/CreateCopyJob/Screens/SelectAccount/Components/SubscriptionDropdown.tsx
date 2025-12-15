/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { Dropdown } from "@fluentui/react";
import React, { useEffect } from "react";
import { Subscription } from "../../../../../../Contracts/DataModels";
import { useSubscriptions } from "../../../../../../hooks/useSubscriptions";
import { userContext } from "../../../../../../UserContext";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import FieldRow from "../../Components/FieldRow";

interface SubscriptionDropdownProps {}

export const SubscriptionDropdown: React.FC<SubscriptionDropdownProps> = React.memo(() => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();
  const subscriptions: Subscription[] = useSubscriptions();

  const updateCopyJobState = (newSubscription: Subscription) => {
    setCopyJobState((prevState) => {
      if (prevState.source?.subscription?.subscriptionId !== newSubscription.subscriptionId) {
        return {
          ...prevState,
          source: {
            ...prevState.source,
            subscription: newSubscription,
            account: null,
          },
        };
      }
      return prevState;
    });
  };

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const currentSubscriptionId = copyJobState?.source?.subscription?.subscriptionId;
      const predefinedSubscriptionId = userContext.subscriptionId;
      const selectedSubscriptionId = currentSubscriptionId || predefinedSubscriptionId;

      const targetSubscription: Subscription | null =
        subscriptions.find((sub) => sub.subscriptionId === selectedSubscriptionId) || null;

      if (targetSubscription) {
        updateCopyJobState(targetSubscription);
      }
    }
  }, [subscriptions?.length]);

  const subscriptionOptions =
    subscriptions?.map((sub) => ({
      key: sub.subscriptionId,
      text: sub.displayName,
      data: sub,
    })) || [];

  const handleSubscriptionChange = (_ev?: React.FormEvent, option?: (typeof subscriptionOptions)[0]) => {
    const selectedSubscription = option?.data as Subscription;

    if (selectedSubscription) {
      updateCopyJobState(selectedSubscription);
    }
  };

  const selectedSubscriptionId = copyJobState?.source?.subscription?.subscriptionId;

  return (
    <FieldRow label={ContainerCopyMessages.subscriptionDropdownLabel}>
      <Dropdown
        placeholder={ContainerCopyMessages.subscriptionDropdownPlaceholder}
        ariaLabel={ContainerCopyMessages.subscriptionDropdownLabel}
        data-test="subscription-dropdown"
        options={subscriptionOptions}
        required
        selectedKey={selectedSubscriptionId}
        onChange={handleSubscriptionChange}
      />
    </FieldRow>
  );
});
