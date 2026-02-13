import { Input, Tree, TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import { Home16Regular, Search20Regular } from "@fluentui/react-icons";
import { AuthType } from "AuthType";
import { useTreeStyles } from "Explorer/Controls/TreeComponent/Styles";
import { TreeNode, TreeNodeComponent } from "Explorer/Controls/TreeComponent/TreeNodeComponent";
import {
  createDatabaseTreeNodes,
  createResourceTokenTreeNodes,
  createSampleDataTreeNodes,
} from "Explorer/Tree/treeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { isFabricMirrored } from "Platform/Fabric/FabricUtil";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
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
  const { isCopilotEnabled, isCopilotSampleDBEnabled } = useQueryCopilot((state) => ({
    isCopilotEnabled: state.copilotEnabled,
    isCopilotSampleDBEnabled: state.copilotSampleDBEnabled,
  }));

  const databaseTreeNodes = useMemo(() => {
    return userContext.authType === AuthType.ResourceToken
      ? createResourceTokenTreeNodes(resourceTokenCollection)
      : createDatabaseTreeNodes(explorer, isNotebookEnabled, databases, refreshActiveTab, searchText);
  }, [resourceTokenCollection, databases, isNotebookEnabled, refreshActiveTab, searchText]);

  const isSampleDataEnabled =
    isCopilotEnabled &&
    isCopilotSampleDBEnabled &&
    userContext.sampleDataConnectionInfo &&
    userContext.apiType === "SQL";

  const sampleDataNodes = useMemo<TreeNode[]>(() => {
    return isSampleDataEnabled && sampleDataResourceTokenCollection
      ? createSampleDataTreeNodes(sampleDataResourceTokenCollection)
      : [];
  }, [isSampleDataEnabled, sampleDataResourceTokenCollection]);

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
    if (sampleDataNodes.length > 0) {
      return [
        ...headerNodes,
        {
          id: "data",
          label: MY_DATA_TREE_LABEL,
          children: databaseTreeNodes,
          isScrollable: true,
        },
        {
          id: "sampleData",
          label: SAMPLE_DATA_TREE_LABEL,
          children: sampleDataNodes,
        },
      ];
    } else {
      return [...headerNodes, ...databaseTreeNodes];
    }
  }, [databaseTreeNodes, sampleDataNodes]);

  // Track complete DatabaseLoad scenario (start, tree rendered, interactive)
  useDatabaseLoadScenario(databaseTreeNodes, databasesFetchedSuccessfully);

  useEffect(() => {
    // Compute open items based on node.isExpanded
    const updateOpenItems = (node: TreeNode, parentNodeId: string): void => {
      // This will look for ANY expanded node, event if its parent node isn't expanded
      // and add it to the openItems list
      const globalId = parentNodeId === undefined ? node.label : `${parentNodeId}/${node.label}`;

      if (node.isExpanded) {
        let found = false;
        for (const id of openItems) {
          if (id === globalId) {
            found = true;
            break;
          }
        }
        if (!found) {
          setOpenItems((prevOpenItems) => [...prevOpenItems, globalId]);
        }
      }

      if (node.children) {
        for (const child of node.children) {
          updateOpenItems(child, globalId);
        }
      }
    };

    rootNodes.forEach((n) => updateOpenItems(n, undefined));
  }, [rootNodes, openItems, setOpenItems]);

  const handleOpenChange = (event: TreeOpenChangeEvent, data: TreeOpenChangeData) =>
    setOpenItems(Array.from(data.openItems));

  return (
    <div className={treeStyles.treeContainer}>
      {userContext.authType !== AuthType.ResourceToken && databases.length > 0 && (
        <div style={{ padding: "8px" }}>
          <Input
            placeholder="Search databases only"
            value={searchText}
            onChange={(_, data) => setSearchText(data?.value || "")}
            size="small"
            contentBefore={<Search20Regular />}
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
