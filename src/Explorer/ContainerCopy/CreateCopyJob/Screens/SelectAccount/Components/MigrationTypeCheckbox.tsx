import { Checkbox, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";

interface MigrationTypeCheckboxProps {
    checked: boolean;
    onChange: (_ev?: React.FormEvent, checked?: boolean) => void;
}

export const MigrationTypeCheckbox: React.FC<MigrationTypeCheckboxProps> = React.memo(
    ({ checked, onChange }) => (
        <Stack horizontal horizontalAlign="space-between" className="migrationTypeRow">
            <Checkbox
                label={ContainerCopyMessages.migrationTypeCheckboxLabel}
                checked={checked}
                onChange={onChange}
            />
        </Stack>
    )
);