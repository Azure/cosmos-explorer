import { FontIcon, Link, Stack, Text } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { GlobalSecondaryIndexSourceComponent } from "./GlobalSecondaryIndexSourceComponent";
import { GlobalSecondaryIndexTargetComponent } from "./GlobalSecondaryIndexTargetComponent";

export interface GlobalSecondaryIndexComponentProps {
  collection: ViewModels.Collection;
  explorer: Explorer;
}

export const GlobalSecondaryIndexComponent: React.FC<GlobalSecondaryIndexComponentProps> = ({
  collection,
  explorer,
}) => {
  const isTargetContainer = !!collection?.materializedViewDefinition();
  const isSourceContainer = !!collection?.materializedViews();

  return (
    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { maxWidth: 600 } }}>
      <Stack horizontal verticalAlign="center" wrap tokens={{ childrenGap: 8 }}>
        {isSourceContainer && (
          <Text styles={{ root: { fontWeight: 600 } }}>This container has the following indexes defined for it.</Text>
        )}
        <Text>
          <Link
            target="_blank"
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views#defining-materialized-views"
          >
            Learn more
            <FontIcon iconName="NavigateExternalInline" style={{ marginLeft: "4px" }} />
          </Link>{" "}
          about how to define global secondary indexes and how to use them.
        </Text>
      </Stack>
      {isSourceContainer && <GlobalSecondaryIndexSourceComponent collection={collection} explorer={explorer} />}
      {isTargetContainer && <GlobalSecondaryIndexTargetComponent collection={collection} />}
    </Stack>
  );
};
