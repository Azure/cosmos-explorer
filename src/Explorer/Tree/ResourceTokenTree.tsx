import React from "react";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { useTabs } from "../../hooks/useTabs";
import { userContext } from "../../UserContext";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { mostRecentActivity } from "../MostRecentActivity/MostRecentActivity";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";

export const ResourceTokenTree: React.FC = (): JSX.Element => {
  const collection = useDatabases((state) => state.resourceTokenCollection);

  const buildCollectionNode = (): TreeNode => {
    if (!collection) {
      return {
        label: undefined,
        isExpanded: true,
        children: [],
      };
    }

    const children: TreeNode[] = [];
    children.push({
      label: "Items",
      onClick: () => {
        collection.onDocumentDBDocumentsClick();
        // push to most recent
        mostRecentActivity.collectionWasOpened(userContext.databaseAccount?.id, collection);
      },
      isSelected: () =>
        useSelectedNode
          .getState()
          .isDataNodeSelected(collection.databaseId, collection.id(), [ViewModels.CollectionTabKind.Documents]),
    });

    const collectionNode: TreeNode = {
      label: collection.id(),
      iconSrc: CollectionIcon,
      isExpanded: true,
      children,
      className: "collectionHeader",
      onClick: () => {
        // Rewritten version of expandCollapseCollection
        useSelectedNode.getState().setSelectedNode(collection);
        useCommandBar.getState().setContextButtons([]);
        useTabs
          .getState()
          .refreshActiveTab(
            (tab) => tab.collection?.id() === collection.id() && tab.collection.databaseId === collection.databaseId,
          );
      },
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(collection.databaseId, collection.id()),
    };

    return {
      label: undefined,
      isExpanded: true,
      children: [collectionNode],
    };
  };

  return <TreeComponent className="dataResourceTree" rootNode={buildCollectionNode()} />;
};
