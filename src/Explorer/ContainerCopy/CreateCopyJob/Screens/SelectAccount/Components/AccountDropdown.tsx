/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { Dropdown } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { DropdownOptionType } from "../../../../Types/CopyJobTypes";
import FieldRow from "../../Components/FieldRow";

interface AccountDropdownProps {
  options: DropdownOptionType[];
  selectedKey?: string;
  disabled: boolean;
  onChange: (_ev?: React.FormEvent, option?: DropdownOptionType) => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = React.memo(
  ({ options, selectedKey, disabled, onChange }) => (
    <FieldRow label={ContainerCopyMessages.sourceAccountDropdownLabel}>
      <Dropdown
        placeholder={ContainerCopyMessages.sourceAccountDropdownPlaceholder}
        ariaLabel={ContainerCopyMessages.sourceAccountDropdownLabel}
        options={options}
        disabled={disabled}
        required
        selectedKey={selectedKey}
        onChange={onChange}
      />
    </FieldRow>
  ),
);
