import React, { useEffect, useState } from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";

export const SampleDataTree = ({
  sampleDataResourceTokenCollection,
}: {
  sampleDataResourceTokenCollection: ViewModels.CollectionBase;
}): JSX.Element => {
  const [root, setRoot] = useState<TreeNode | undefined>(undefined);

  useEffect(() => {
    if (sampleDataResourceTokenCollection) {
      const updatedSampleTree: TreeNode = {
        label: sampleDataResourceTokenCollection.databaseId,
        isExpanded: true,
        iconSrc: CosmosDBIcon,
        children: [
          {
            label: sampleDataResourceTokenCollection.id(),
            iconSrc: CollectionIcon,
            isExpanded: true,
            className: "collectionHeader",
            children: [
              {
                label: "Items",
              },
            ],
          },
        ],
      };
      setRoot(updatedSampleTree);
    }
  }, [sampleDataResourceTokenCollection]);

  return (
    <TreeComponent className="sampleDataResourceTree" rootNode={root || { label: "Sample data not initialized." }} />
  );
};
