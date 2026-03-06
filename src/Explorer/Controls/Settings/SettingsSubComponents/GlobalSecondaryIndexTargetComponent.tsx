import { Stack, Text } from "@fluentui/react";
import * as React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { Keys } from "../../../../Localization/Keys.generated";
import { t } from "../../../../Localization/t";

export interface GlobalSecondaryIndexTargetComponentProps {
  collection: ViewModels.Collection;
}

export const GlobalSecondaryIndexTargetComponent: React.FC<GlobalSecondaryIndexTargetComponentProps> = ({
  collection,
}) => {
  const globalSecondaryIndexDefinition = collection?.materializedViewDefinition();

  const textHeadingStyle = {
    root: { fontWeight: "600", fontSize: 16 },
  };

  const valueBoxStyle = {
    root: {
      backgroundColor: "#f3f3f3",
      padding: "5px 10px",
      borderRadius: "4px",
    },
  };

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { maxWidth: 600 } }}>
      <Text styles={textHeadingStyle}>{t(Keys.controls.settings.globalSecondaryIndex.settingsTitle)}</Text>

      <Stack tokens={{ childrenGap: 5 }}>
        <Text styles={{ root: { fontWeight: "600" } }}>{t(Keys.controls.settings.globalSecondaryIndex.sourceContainer)}</Text>
        <Stack styles={valueBoxStyle}>
          <Text>{globalSecondaryIndexDefinition?.sourceCollectionId}</Text>
        </Stack>
      </Stack>

      <Stack tokens={{ childrenGap: 5 }}>
        <Text styles={{ root: { fontWeight: "600" } }}>{t(Keys.controls.settings.globalSecondaryIndex.indexDefinition)}</Text>
        <Stack styles={valueBoxStyle}>
          <Text>{globalSecondaryIndexDefinition?.definition}</Text>
        </Stack>
      </Stack>
    </Stack>
  );
};
