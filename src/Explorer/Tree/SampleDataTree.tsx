import { useSelectedNode } from "Explorer/useSelectedNode";
import React, { useEffect, useState } from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
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
        isExpanded: false,
        iconSrc: CosmosDBIcon,
        className: "databaseHeader",
        children: [
          {
            label: sampleDataResourceTokenCollection.id(),
            iconSrc: CollectionIcon,
            isExpanded: false,
            className: "dataResourceTree",
            contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(
              sampleDataResourceTokenCollection
            ),
            isSelected: () =>
              useSelectedNode
                .getState()
                .isDataNodeSelected(
                  sampleDataResourceTokenCollection.databaseId,
                  sampleDataResourceTokenCollection.id()
                ),
            onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection),
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

  return <TreeComponent className="dataResourceTree" rootNode={root || { label: "Sample data not initialized." }} />;
};
