/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { Checkbox, ICheckboxStyles, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";

interface MigrationTypeCheckboxProps {
  checked: boolean;
  onChange: (_ev?: React.FormEvent, checked?: boolean) => void;
}

const checkboxStyles: ICheckboxStyles = {
  text: { color: "var(--colorNeutralForeground1)" },
  checkbox: { borderColor: "var(--colorNeutralStroke1)" },
  root: {
    selectors: {
      ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
    },
  },
};

export const MigrationTypeCheckbox: React.FC<MigrationTypeCheckboxProps> = React.memo(({ checked, onChange }) => {
  return (
    <Stack horizontal horizontalAlign="space-between" className="migrationTypeRow" data-test="migration-type-checkbox">
      <Checkbox
        label={ContainerCopyMessages.migrationTypeCheckboxLabel}
        checked={checked}
        onChange={onChange}
        styles={checkboxStyles}
      />
    </Stack>
  );
});
