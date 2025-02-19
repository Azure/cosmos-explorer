import { Link, PrimaryButton, Stack, Text } from "@fluentui/react";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { MaterializedViewSourceComponent } from "./MaterializedViewSourceComponent";

export interface MaterializedViewComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewComponent: React.FC<MaterializedViewComponentProps> = ({ collection }) => {
  const isTargetContainer = !!collection?.materializedViewDefinition();
  const materializedViews = collection?.materializedViews() ?? [];

  if (isTargetContainer) {
    return null;
  }

  const showEditor = materializedViews.length > 0;
  const jsonValue = JSON.stringify(
    materializedViews.map((view) => ({
      name: view.id,
      definition: view.id,
    })),
    null,
    2,
  );

  return (
    <Stack tokens={{ childrenGap: 12 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack horizontal verticalAlign="center" wrap tokens={{ childrenGap: 8 }}>
        <Text styles={{ root: { fontWeight: 600 } }}>This container has the following views defined for it</Text>
        <Link target="_blank" href="https://aka.ms/MicrosoftCopilotForAzureInCDBHowTo">
          Learn more
        </Link>
        <Text>about how to define materialized views and how to use them.</Text>
      </Stack>

      {showEditor && <MaterializedViewSourceComponent jsonValue={jsonValue} />}

      <PrimaryButton
        text="Add view"
        styles={{ root: { width: "fit-content" } }}
        onClick={() => console.log("Add view clicked")}
      />
    </Stack>
  );
};
