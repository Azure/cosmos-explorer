import {
  FluentProvider,
  Tree,
  TreeItemValue,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
} from "@fluentui/react-components";
import { TreeNode2, TreeNode2Component } from "Explorer/Controls/TreeComponent2/TreeNode2Component";
import { dataExplorerLightTheme } from "Explorer/Theme/ThemeUtil";
import { useDatabaseTreeNodes } from "Explorer/Tree2/useDatabaseTreeNodes";
import * as React from "react";
import shallow from "zustand/shallow";
import Explorer from "../Explorer";
import { useNotebook } from "../Notebook/useNotebook";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";

interface ResourceTreeProps {
  container: Explorer;
}

export const DATA_TREE_LABEL = "DATA";

/**
 * Top-level tree that has no label, but contains all subtrees
 */
export const ResourceTree2: React.FC<ResourceTreeProps> = ({ container }: ResourceTreeProps): JSX.Element => {
  const {
    isNotebookEnabled,
    // myNotebooksContentRoot,
    // galleryContentRoot,
    // gitHubNotebooksContentRoot,
    // updateNotebookItem,
  } = useNotebook(
    (state) => ({
      isNotebookEnabled: state.isNotebookEnabled,
      myNotebooksContentRoot: state.myNotebooksContentRoot,
      galleryContentRoot: state.galleryContentRoot,
      gitHubNotebooksContentRoot: state.gitHubNotebooksContentRoot,
      updateNotebookItem: state.updateNotebookItem,
    }),
    shallow,
  );
  // const { activeTab } = useTabs();
  const databaseTreeNodes = useDatabaseTreeNodes(container, isNotebookEnabled);
  const [openItems, setOpenItems] = React.useState<Iterable<TreeItemValue>>([DATA_TREE_LABEL]);

  const dataNodeTree: TreeNode2 = {
    id: "data",
    label: DATA_TREE_LABEL,
    className: "accordionItemHeader",
    children: databaseTreeNodes,
    isScrollable: true,
  };

  React.useEffect(() => {
    // Compute open items based on node.isExpanded
    const updateOpenItems = (node: TreeNode2, parentNodeId: string): void => {
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

    updateOpenItems(dataNodeTree, undefined);
  }, [databaseTreeNodes]);

  const handleOpenChange = (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => setOpenItems(data.openItems);

  return (
    <>
      <FluentProvider theme={dataExplorerLightTheme} style={{ overflow: "hidden" }}>
        <Tree
          aria-label="CosmosDB resources"
          openItems={openItems}
          onOpenChange={handleOpenChange}
          size="medium"
          style={{ height: "100%", width: "290px" }}
        >
          {[dataNodeTree].map((node) => (
            <TreeNode2Component key={node.label} className="dataResourceTree" node={node} treeNodeId={node.label} />
          ))}
        </Tree>
      </FluentProvider>
    </>
  );
};
