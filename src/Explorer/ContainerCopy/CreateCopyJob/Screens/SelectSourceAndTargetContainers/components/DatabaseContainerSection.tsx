import { ActionButton, Dropdown, Stack } from "@fluentui/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { DatabaseContainerSectionProps } from "../../../../Types/CopyJobTypes";
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
  containerOnChange,
  handleOnDemandCreateContainer,
  sectionType,
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
        data-test={`${sectionType}-databaseDropdown`}
      />
    </FieldRow>
    <FieldRow label={ContainerCopyMessages.containerDropdownLabel}>
      <Stack>
        <Dropdown
          placeholder={ContainerCopyMessages.containerDropdownPlaceholder}
          ariaLabel={ContainerCopyMessages.containerDropdownLabel}
          options={containerOptions}
          required
          disabled={!!containerDisabled}
          selectedKey={selectedContainer}
          onChange={containerOnChange}
          data-test={`${sectionType}-containerDropdown`}
        />
        {handleOnDemandCreateContainer && (
          <ActionButton className="create-container-link-btn" onClick={() => handleOnDemandCreateContainer()}>
            {ContainerCopyMessages.createContainerButtonLabel}
          </ActionButton>
        )}
      </Stack>
    </FieldRow>
  </Stack>
);
