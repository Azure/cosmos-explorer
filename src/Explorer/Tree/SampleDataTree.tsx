import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import TabsBase from "Explorer/Tabs/TabsBase";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { getItemName } from "Utils/APITypeUtils";
import { useTabs } from "hooks/useTabs";
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
            className: "sampleCollectionHeader",
            contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
            onClick: () => {
              // Rewritten version of expandCollapseCollection
              useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection);
              useCommandBar.getState().setContextButtons([]);
              useTabs().refreshActiveTab(
                (tab: TabsBase) =>
                  tab.collection?.id() === sampleDataResourceTokenCollection.id() &&
                  tab.collection.databaseId === sampleDataResourceTokenCollection.databaseId
              );
            },
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
                label: getItemName(),
                id: sampleDataResourceTokenCollection.isSampleCollection ? "sampleItems" : "",
                contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
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
