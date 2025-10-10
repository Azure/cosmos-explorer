import { Dropdown, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { DatabaseContainerSectionProps } from "../../../../Types";
import FieldRow from "../../Components/FieldRow";

export const DatabaseContainerSection = ({
    heading,
    databaseOptions,
    selectedDatabase,
    databaseDisabled,
    databaseOnChange,
    containerOptions,
    selectedContainer,
    containerDisabled,
    containerOnChange
}: DatabaseContainerSectionProps) => (
    <Stack tokens={{ childrenGap: 15 }} className="databaseContainerSection">
        <label className="subHeading">{heading}</label>
        <FieldRow label={ContainerCopyMessages.databaseDropdownLabel}>
            <Dropdown
                placeholder={ContainerCopyMessages.databaseDropdownPlaceholder}
                ariaLabel={ContainerCopyMessages.databaseDropdownLabel}
                options={databaseOptions}
                required
                disabled={!!databaseDisabled}
                selectedKey={selectedDatabase}
                onChange={databaseOnChange}
            />
        </FieldRow>
        <FieldRow label={ContainerCopyMessages.containerDropdownLabel}>
            <Dropdown
                placeholder={ContainerCopyMessages.containerDropdownPlaceholder}
                ariaLabel={ContainerCopyMessages.containerDropdownLabel}
                options={containerOptions}
                required
                disabled={!!containerDisabled}
                selectedKey={selectedContainer}
                onChange={containerOnChange}
            />
        </FieldRow>
    </Stack>
);
