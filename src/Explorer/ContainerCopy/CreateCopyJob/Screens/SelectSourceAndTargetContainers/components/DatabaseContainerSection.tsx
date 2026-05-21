import { ActionButton, Dropdown, Stack } from "@fluentui/react";
import { Keys, t } from "Localization";
import React from "react";
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
    <FieldRow label={t(Keys.containerCopy.selectContainers.databaseDropdownLabel)}>
      <Dropdown
        placeholder={t(Keys.containerCopy.selectContainers.databaseDropdownPlaceholder)}
        ariaLabel={t(Keys.containerCopy.selectContainers.databaseDropdownLabel)}
        options={databaseOptions}
        required
        disabled={!!databaseDisabled}
        selectedKey={selectedDatabase}
        onChange={databaseOnChange}
        data-test={`${sectionType}-databaseDropdown`}
      />
    </FieldRow>
    <FieldRow label={t(Keys.containerCopy.selectContainers.containerDropdownLabel)}>
      <Stack>
        <Dropdown
          placeholder={t(Keys.containerCopy.selectContainers.containerDropdownPlaceholder)}
          ariaLabel={t(Keys.containerCopy.selectContainers.containerDropdownLabel)}
          options={containerOptions}
          required
          disabled={!!containerDisabled}
          selectedKey={selectedContainer}
          onChange={containerOnChange}
          data-test={`${sectionType}-containerDropdown`}
        />
        {handleOnDemandCreateContainer && (
          <ActionButton
            className="create-container-link-btn"
            style={{ color: "var(--colorBrandForeground1)" }}
            onClick={() => handleOnDemandCreateContainer()}
          >
            {t(Keys.containerCopy.selectContainers.createContainerButtonLabel)}
          </ActionButton>
        )}
      </Stack>
    </FieldRow>
  </Stack>
);
