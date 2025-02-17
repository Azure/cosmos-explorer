import { Text } from "@fluentui/react";
import React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";

export interface MaterializedViewComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewComponent: React.FC<MaterializedViewComponentProps> = ({ collection }) => {
  console.log("collection", collection);
  const sourceId = collection.materializedViewDefinition()?.sourceCollectionId;
  return <Text>{`Source ID: ${sourceId}`}</Text>;
};
