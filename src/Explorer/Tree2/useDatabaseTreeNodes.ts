import { TreeNode2 } from "Explorer/Controls/TreeComponent2/TreeNode2Component";
import TabsBase from "Explorer/Tabs/TabsBase";
import { buildCollectionNode } from "Explorer/Tree2/containerTreeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { useTabs } from "hooks/useTabs";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import * as ResourceTreeContextMenuButtonFactory from "../ContextMenuButtonFactory";
import Explorer from "../Explorer";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import { useSelectedNode } from "../useSelectedNode";

export const useDatabaseTreeNodes = (container: Explorer, isNotebookEnabled: boolean): TreeNode2[] => {
  const databases = useDatabases((state) => state.databases);
  const { refreshActiveTab } = useTabs();

  const databaseTreeNodes: TreeNode2[] = databases.map((database: ViewModels.Database) => {
    const databaseNode: TreeNode2 = {
      label: database.id(),
      iconSrc: CosmosDBIcon,
      className: "databaseHeader",
      children: [],
      isSelected: () => useSelectedNode.getState().isDataNodeSelected(database.id()),
      contextMenu: ResourceTreeContextMenuButtonFactory.createDatabaseContextMenu(container, database.id()),
      onExpanded: async () => {
        useSelectedNode.getState().setSelectedNode(database);
        if (databaseNode.children?.length === 0) {
          databaseNode.isLoading = true;
        }
        await database.expandDatabase();
        databaseNode.isLoading = false;
        useCommandBar.getState().setContextButtons([]);
        refreshActiveTab((tab: TabsBase) => tab.collection?.databaseId === database.id());
      },
      onContextMenuOpen: () => useSelectedNode.getState().setSelectedNode(database),
    };

    if (database.isDatabaseShared()) {
      databaseNode.children.push({
        id: database.isSampleDB ? "sampleScaleSettings" : "",
        label: "Scale",
        isSelected: () =>
          useSelectedNode
            .getState()
            .isDataNodeSelected(database.id(), undefined, [ViewModels.CollectionTabKind.DatabaseSettingsV2]),
        onClick: database.onSettingsClick.bind(database),
      });
    }

    // Find collections
    database
      .collections()
      .forEach((collection: ViewModels.Collection) =>
        databaseNode.children.push(
          buildCollectionNode(database, collection, isNotebookEnabled, container, refreshActiveTab)
        )
      );

    if (database.collectionsContinuationToken) {
      const loadMoreNode: TreeNode2 = {
        label: "load more",
        className: "loadMoreHeader",
        onClick: async () => {
          await database.loadCollections();
          useDatabases.getState().updateDatabase(database);
        },
      };
      databaseNode.children.push(loadMoreNode);
    }

    database.collections.subscribe((collections: ViewModels.Collection[]) => {
      collections.forEach((collection: ViewModels.Collection) =>
        databaseNode.children.push(
          buildCollectionNode(database, collection, isNotebookEnabled, container, refreshActiveTab)
        )
      );
    });

    return databaseNode;
  });

  return databaseTreeNodes;
};
