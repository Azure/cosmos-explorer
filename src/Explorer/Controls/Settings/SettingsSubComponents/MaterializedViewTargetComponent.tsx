import { Stack, Text } from "@fluentui/react";
import * as React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";

export interface MaterializedViewTargetComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewTargetComponent: React.FC<MaterializedViewTargetComponentProps> = ({ collection }) => {
  const materializedViewDefinition = collection?.materializedViewDefinition();

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
      <Text styles={textHeadingStyle}>Materialized View Settings</Text>

      <Stack tokens={{ childrenGap: 5 }}>
        <Text styles={{ root: { fontWeight: "600" } }}>Source container</Text>
        <Stack styles={valueBoxStyle}>
          <Text>{materializedViewDefinition?.sourceCollectionId}</Text>
        </Stack>
      </Stack>

      <Stack tokens={{ childrenGap: 5 }}>
        <Text styles={{ root: { fontWeight: "600" } }}>Materialized view definition</Text>
        <Stack styles={valueBoxStyle}>
          <Text>{materializedViewDefinition?.definition}</Text>
        </Stack>
      </Stack>
    </Stack>
  );
};
