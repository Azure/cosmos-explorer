import {
  Button,
  Input,
  Tree,
  TreeItemValue,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
} from "@fluentui/react-components";
import { ArrowSortDown20Regular, ArrowSortUp20Regular, Home16Regular, Search20Regular } from "@fluentui/react-icons";
import { AuthType } from "AuthType";
import { useTreeStyles } from "Explorer/Controls/TreeComponent/Styles";
import { TreeNode, TreeNodeComponent } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import { createDatabaseTreeNodes, createResourceTokenTreeNodes } from "Explorer/Tree/treeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { isFabricMirrored } from "Platform/Fabric/FabricUtil";
import { userContext } from "UserContext";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import * as React from "react";
import { useEffect, useMemo } from "react";
import shallow from "zustand/shallow";
import { useDatabaseLoadScenario } from "../../Metrics/useMetricPhases";
import Explorer from "../Explorer";
import { useNotebook } from "../Notebook/useNotebook";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";

interface ResourceTreeProps {
  explorer: Explorer;
}

export const DATA_TREE_LABEL = "DATA";
export const MY_DATA_TREE_LABEL = "MY DATA";
export const SAMPLE_DATA_TREE_LABEL = "SAMPLE DATA";

/**
 * Top-level tree that has no label, but contains all subtrees
 */
export const ResourceTree: React.FC<ResourceTreeProps> = ({ explorer }: ResourceTreeProps): JSX.Element => {
  const [openItems, setOpenItems] = React.useState<TreeItemValue[]>([]);
  const treeStyles = useTreeStyles();

  const { isNotebookEnabled } = useNotebook(
    (state) => ({
      isNotebookEnabled: state.isNotebookEnabled,
    }),
    shallow,
  );

  // We intentionally avoid using a state selector here because we want to re-render the tree if the active tab changes.
  const { refreshActiveTab } = useTabs();

  const { databases, resourceTokenCollection, sampleDataResourceTokenCollection } = useDatabases((state) => ({
    databases: state.databases,
    resourceTokenCollection: state.resourceTokenCollection,
    sampleDataResourceTokenCollection: state.sampleDataResourceTokenCollection,
  }));
  const databasesFetchedSuccessfully = useDatabases((state) => state.databasesFetchedSuccessfully);
  const searchText = useDatabases((state) => state.searchText);
  const setSearchText = useDatabases((state) => state.setSearchText);
  const sortOrder = useDatabases((state) => state.sortOrder);
  const setSortOrder = useDatabases((state) => state.setSortOrder);
  const pinnedDatabaseIds = useDatabases((state) => state.pinnedDatabaseIds);

  const databaseTreeNodes = useMemo(() => {
    return userContext.authType === AuthType.ResourceToken
      ? createResourceTokenTreeNodes(resourceTokenCollection)
      : createDatabaseTreeNodes(
          explorer,
          isNotebookEnabled,
          databases,
          refreshActiveTab,
          searchText,
          sortOrder,
          pinnedDatabaseIds,
        );
  }, [
    resourceTokenCollection,
    databases,
    isNotebookEnabled,
    refreshActiveTab,
    searchText,
    sortOrder,
    pinnedDatabaseIds,
  ]);

  const headerNodes: TreeNode[] = isFabricMirrored()
    ? []
    : [
        {
          id: "home",
          iconSrc: <Home16Regular />,
          label: "Home",
          isSelected: () =>
            useSelectedNode.getState().selectedNode === undefined &&
            useTabs.getState().activeReactTab === ReactTabKind.Home,
          onClick: () => {
            useSelectedNode.getState().setSelectedNode(undefined);
            useTabs.getState().openAndActivateReactTab(ReactTabKind.Home);
          },
        },
      ];

  const rootNodes: TreeNode[] = useMemo(() => {
    return [...headerNodes, ...databaseTreeNodes];
    // headerNodes is intentionally excluded — it depends only on isFabricMirrored() which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [databaseTreeNodes]);

  // Track complete DatabaseLoad scenario (start, tree rendered, interactive)
  useDatabaseLoadScenario(databaseTreeNodes, databasesFetchedSuccessfully);

  useEffect(() => {
    const expandedIds: TreeItemValue[] = [];
    const collectExpandedIds = (node: TreeNode, parentNodeId: string | undefined): void => {
      const globalId = parentNodeId === undefined ? node.label : `${parentNodeId}/${node.label}`;
      if (node.isExpanded) {
        expandedIds.push(globalId);
      }
      if (node.children) {
        for (const child of node.children) {
          collectExpandedIds(child, globalId);
        }
      }
    };

    rootNodes.forEach((n) => collectExpandedIds(n, undefined));

    if (expandedIds.length > 0) {
      setOpenItems((prevOpenItems) => {
        const prevSet = new Set(prevOpenItems);
        const newIds = expandedIds.filter((id) => !prevSet.has(id));
        return newIds.length > 0 ? [...prevOpenItems, ...newIds] : prevOpenItems;
      });
    }
  }, [rootNodes]);

  const handleOpenChange = (event: TreeOpenChangeEvent, data: TreeOpenChangeData) =>
    setOpenItems(Array.from(data.openItems));

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "az" ? "za" : "az");
  };

  return (
    <div className={treeStyles.treeContainer}>
      {userContext.authType !== AuthType.ResourceToken && databases.length > 0 && (
        <div style={{ padding: "8px", display: "flex", gap: "4px", alignItems: "center" }}>
          <Input
            placeholder="Search databases only"
            value={searchText}
            onChange={(_, data) => setSearchText(data?.value || "")}
            size="small"
            contentBefore={<Search20Regular />}
            style={{ flex: 1 }}
          />
          <Button
            appearance="subtle"
            size="small"
            icon={sortOrder === "az" ? <ArrowSortDown20Regular /> : <ArrowSortUp20Regular />}
            onClick={toggleSortOrder}
          />
        </div>
      )}
      <Tree
        aria-label="CosmosDB resources"
        openItems={openItems}
        className={treeStyles.tree}
        onOpenChange={handleOpenChange}
        size="medium"
      >
        {rootNodes.map((node) => (
          <TreeNodeComponent
            key={node.label}
            openItems={openItems}
            className="dataResourceTree"
            node={node}
            treeNodeId={node.label}
          />
        ))}
      </Tree>
    </div>
  );
};
