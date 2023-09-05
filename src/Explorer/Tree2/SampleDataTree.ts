import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import TabsBase from "Explorer/Tabs/TabsBase";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { useTabs } from "hooks/useTabs";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import { TreeNode } from "../Controls/TreeComponent/TreeComponent";

export const buildSampleDataTree = (sampleDataResourceTokenCollection: ViewModels.CollectionBase): TreeNode => {
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
        className: "collectionHeader",
        contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
        onClick: () => {
          useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection);
          useCommandBar.getState().setContextButtons([]);
          useTabs
            .getState()
            .refreshActiveTab(
              (tab: TabsBase) =>
                tab.collection?.id() === sampleDataResourceTokenCollection.id() &&
                tab.collection.databaseId === sampleDataResourceTokenCollection.databaseId
            );
        },
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(sampleDataResourceTokenCollection.databaseId, sampleDataResourceTokenCollection.id()),
        onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(sampleDataResourceTokenCollection),
        children: [
          {
            label: "Items",
            onClick: () => sampleDataResourceTokenCollection.onDocumentDBDocumentsClick(),
            contextMenu: ResourceTreeContextMenuButtonFactory.createSampleCollectionContextMenuButton(),
            isSelected: () =>
              useSelectedNode
                .getState()
                .isDataNodeSelected(
                  sampleDataResourceTokenCollection.databaseId,
                  sampleDataResourceTokenCollection.id(),
                  [ViewModels.CollectionTabKind.Documents]
                ),
          },
        ],
      },
    ],
  };

  // TODO handle case non-initialized
  return updatedSampleTree;

  // export const SampleDataTree = ({
  //   sampleDataResourceTokenCollection,
  // }: {
  //   sampleDataResourceTokenCollection: ViewModels.CollectionBase;
  // }): JSX.Element => {

  //     return {
  //       id: "sampleData",
  //       label: "SAMPLE DATA",
  //       isExpanded: true,
  //       children: [updatedSampleTree],
  //     };
  //   };

  //   return (
  //     <TreeNodeComponent
  //       className="dataResourceTree"
  //       node={sampleDataResourceTokenCollection ? buildSampleDataTree() : { label: "Sample data not initialized." }}
  //     />
  //   );
};
