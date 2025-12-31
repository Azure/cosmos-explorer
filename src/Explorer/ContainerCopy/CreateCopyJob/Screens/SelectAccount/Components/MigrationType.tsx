/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { ChoiceGroup, IChoiceGroupOption, Stack, Text } from "@fluentui/react";
import MarkdownRender from "@nteract/markdown";
import { useCopyJobContext } from "Explorer/ContainerCopy/Context/CopyJobContext";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";

interface MigrationTypeProps {}
const options: IChoiceGroupOption[] = [
  {
    key: CopyJobMigrationType.Offline,
    text: ContainerCopyMessages.migrationTypeOptions.offline.title,
    styles: { root: { width: "33%" } },
  },
  {
    key: CopyJobMigrationType.Online,
    text: ContainerCopyMessages.migrationTypeOptions.online.title,
    styles: { root: { width: "33%" } },
  },
];

export const MigrationType: React.FC<MigrationTypeProps> = React.memo(() => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();
  const handleChange = (_ev?: React.FormEvent, option?: IChoiceGroupOption) => {
    if (option) {
      setCopyJobState((prevState) => ({
        ...prevState,
        migrationType: option.key as CopyJobMigrationType,
      }));
    }
  };

  const selectedKey = copyJobState?.migrationType ?? "";
  const selectedKeyLowercase = selectedKey.toLowerCase() as keyof typeof ContainerCopyMessages.migrationTypeOptions;
  const selectedKeyContent = ContainerCopyMessages.migrationTypeOptions[selectedKeyLowercase];

  return (
    <Stack data-test="migration-type" className="migrationTypeContainer">
      <Stack.Item>
        <ChoiceGroup
          selectedKey={selectedKey}
          options={options}
          onChange={handleChange}
          ariaLabelledBy="migrationTypeChoiceGroup"
          styles={{ flexContainer: { display: "flex" } }}
        />
      </Stack.Item>
      {selectedKeyContent && (
        <Stack.Item styles={{ root: { marginTop: 10 } }}>
          <Text
            variant="small"
            className="migrationTypeDescription"
            data-testid={`migration-type-description-${selectedKeyLowercase}`}
          >
            <MarkdownRender source={selectedKeyContent.description} linkTarget="_blank" />
          </Text>
        </Stack.Item>
      )}
    </Stack>
  );
});
