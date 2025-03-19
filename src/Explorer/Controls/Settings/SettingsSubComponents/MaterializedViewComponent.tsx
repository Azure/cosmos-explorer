import { FontIcon, Link, Stack, Text } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { MaterializedViewSourceComponent } from "./MaterializedViewSourceComponent";
import { MaterializedViewTargetComponent } from "./MaterializedViewTargetComponent";

export interface MaterializedViewComponentProps {
  collection: ViewModels.Collection;
  explorer: Explorer;
}

export const MaterializedViewComponent: React.FC<MaterializedViewComponentProps> = ({ collection, explorer }) => {
  const isTargetContainer = !!collection?.materializedViewDefinition();
  const isSourceContainer = !!collection?.materializedViews();

  return (
    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack horizontal verticalAlign="center" wrap tokens={{ childrenGap: 8 }}>
        {isSourceContainer && (
          <Text styles={{ root: { fontWeight: 600 } }}>This container has the following views defined for it.</Text>
        )}
        <Text>
          <Link
            target="_blank"
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views#defining-materialized-views"
          >
            Learn more
            <FontIcon iconName="NavigateExternalInline" style={{ marginLeft: "4px" }} />
          </Link>{" "}
          about how to define materialized views and how to use them.
        </Text>
      </Stack>
      {isSourceContainer && <MaterializedViewSourceComponent collection={collection} explorer={explorer} />}
      {isTargetContainer && <MaterializedViewTargetComponent collection={collection} />}
    </Stack>
  );
};
