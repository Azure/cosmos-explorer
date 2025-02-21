import { Link, Stack, Text } from "@fluentui/react";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { MaterializedViewSourceComponent } from "./MaterializedViewSourceComponent";
import { MaterializedViewTargetComponent } from "./MaterializedViewTargetComponent";

export interface MaterializedViewComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewComponent: React.FC<MaterializedViewComponentProps> = ({ collection }) => {
  const isTargetContainer = !!collection?.materializedViewDefinition();
  const isSourceContainer = !!collection?.materializedViews();

  return (
    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack horizontal verticalAlign="center" wrap tokens={{ childrenGap: 8 }}>
        <Text styles={{ root: { fontWeight: 600 } }}>This container has the following views defined for it.</Text>
        {/* change href */}
        <Text>
          <Link target="_blank" href="https://aka.ms/MicrosoftCopilotForAzureInCDBHowTo">
            Learn more
          </Link>{" "}
          about how to define materialized views and how to use them.
        </Text>
      </Stack>
      {isSourceContainer && <MaterializedViewSourceComponent collection={collection} />}
      {isTargetContainer && <MaterializedViewTargetComponent collection={collection} />}
    </Stack>
  );
};
