import { Link, Stack, Text } from "@fluentui/react";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { MaterializedViewSourceComponent } from "./MaterializedViewSourceComponent";

export interface MaterializedViewComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewComponent: React.FC<MaterializedViewComponentProps> = ({ collection }) => {
  // If this container itself defines a materialized view, skip rendering this component.
  const isTargetContainer = !!collection?.materializedViewDefinition();
  if (isTargetContainer) {
    return null;
  }

  return (
    <Stack tokens={{ childrenGap: 12 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack horizontal verticalAlign="center" wrap tokens={{ childrenGap: 8 }}>
        <Text styles={{ root: { fontWeight: 600 } }}>This container has the following views defined for it</Text>
        <Link target="_blank" href="https://aka.ms/MicrosoftCopilotForAzureInCDBHowTo">
          Learn more
        </Link>
        <Text>about how to define materialized views and how to use them.</Text>
      </Stack>
      <MaterializedViewSourceComponent collection={collection} />
    </Stack>
  );
};
