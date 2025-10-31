/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { Dropdown } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { DropdownOptionType } from "../../../../Types";
import FieldRow from "../../Components/FieldRow";

interface SubscriptionDropdownProps {
  options: DropdownOptionType[];
  selectedKey?: string;
  onChange: (_ev?: React.FormEvent, option?: DropdownOptionType) => void;
}

export const SubscriptionDropdown: React.FC<SubscriptionDropdownProps> = React.memo(
  ({ options, selectedKey, onChange }) => (
    <FieldRow label={ContainerCopyMessages.subscriptionDropdownLabel}>
      <Dropdown
        placeholder={ContainerCopyMessages.subscriptionDropdownPlaceholder}
        ariaLabel={ContainerCopyMessages.subscriptionDropdownLabel}
        options={options}
        required
        selectedKey={selectedKey}
        onChange={onChange}
      />
    </FieldRow>
  ),
);
