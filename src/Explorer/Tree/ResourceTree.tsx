import {
  BrandVariants,
  FluentProvider,
  Theme,
  Tree,
  TreeItemValue,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
  createLightTheme,
} from "@fluentui/react-components";
import { AuthType } from "AuthType";
import { TreeNode2, TreeNode2Component } from "Explorer/Controls/TreeComponent2/TreeNode2Component";
import { createDatabaseTreeNodes, createResourceTokenTreeNodes, createSampleDataTreeNodes } from "Explorer/Tree/treeNodeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";
import * as React from "react";
import { useEffect, useMemo } from "react";
import shallow from "zustand/shallow";
import Explorer from "../Explorer";
import { useNotebook } from "../Notebook/useNotebook";

export const MyNotebooksTitle = "My Notebooks";
export const GitHubReposTitle = "GitHub repos";

interface ResourceTreeProps {
  container: Explorer;
}

const cosmosdb: BrandVariants = {
  10: "#020305",
  20: "#111723",
  30: "#16263D",
  40: "#193253",
  50: "#1B3F6A",
  60: "#1B4C82",
  70: "#18599B",
  80: "#1267B4",
  90: "#3174C2",
  100: "#4F82C8",
  110: "#6790CF",
  120: "#7D9ED5",
  130: "#92ACDC",
  140: "#A6BAE2",
  150: "#BAC9E9",
  160: "#CDD8EF",
};

const lightTheme: Theme = {
  ...createLightTheme(cosmosdb),
};

export const DATA_TREE_LABEL = "DATA";
export const MY_DATA_TREE_LABEL = "MY DATA";
export const SAMPLE_DATA_TREE_LABEL = "SAMPLE DATA";

/**
 * Top-level tree that has no label, but contains all subtrees
 */
export const ResourceTree: React.FC<ResourceTreeProps> = ({ container }: ResourceTreeProps): JSX.Element => {
  const [openItems, setOpenItems] = React.useState<Iterable<TreeItemValue>>([DATA_TREE_LABEL]);

  const {
    isNotebookEnabled,
  } = useNotebook(
    (state) => ({
      isNotebookEnabled: state.isNotebookEnabled,
    }),
    shallow,
  );
  const refreshActiveTab = useTabs(state => state.refreshActiveTab)
  const { databases, resourceTokenCollection, sampleDataResourceTokenCollection } = useDatabases(state => ({
    databases: state.databases,
    resourceTokenCollection: state.resourceTokenCollection,
    sampleDataResourceTokenCollection: state.sampleDataResourceTokenCollection
  }));
  const { isCopilotEnabled, isCopilotSampleDBEnabled } = useQueryCopilot(state => ({
    isCopilotEnabled: state.copilotEnabled,
    isCopilotSampleDBEnabled: state.copilotSampleDBEnabled
  }));

  const databaseTreeNodes = userContext.authType === AuthType.ResourceToken
    ? createResourceTokenTreeNodes(resourceTokenCollection)
    : createDatabaseTreeNodes(container, isNotebookEnabled, databases, refreshActiveTab);

  const isSampleDataEnabled = 
    isCopilotEnabled &&
    isCopilotSampleDBEnabled &&
    userContext.sampleDataConnectionInfo &&
    userContext.apiType === "SQL";

  const sampleDataNodes = useMemo<TreeNode2[]>(() => {
    return isSampleDataEnabled && sampleDataResourceTokenCollection
      ? createSampleDataTreeNodes(sampleDataResourceTokenCollection)
      : [];
  }, [isSampleDataEnabled, sampleDataResourceTokenCollection]);

  const rootNodes: TreeNode2[] = useMemo(() => {
    if (sampleDataNodes.length > 0) {
      return [
        {
          id: "data",
          label: MY_DATA_TREE_LABEL,
          className: "accordionItemHeader",
          children: databaseTreeNodes,
          isScrollable: true,
        },
        {
          id: "sampleData",
          label: SAMPLE_DATA_TREE_LABEL,
          className: "accordionItemHeader",
          children: sampleDataNodes
        }
      ];
    }
    else {
      return [
        {
          id: "data",
          label: DATA_TREE_LABEL,
          className: "accordionItemHeader",
          children: databaseTreeNodes,
          isScrollable: true,
        }
      ];
    }
  }, [databaseTreeNodes, sampleDataNodes]);

  useEffect(() => {
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

    rootNodes.forEach(n => updateOpenItems(n, undefined));
  }, [rootNodes, openItems, setOpenItems]);

  const handleOpenChange = (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => setOpenItems(data.openItems);

  return (
    <>
      <FluentProvider theme={lightTheme} style={{ overflow: "hidden" }}>
        <Tree
          aria-label="CosmosDB resources"
          openItems={openItems}
          onOpenChange={handleOpenChange}
          size="medium"
          style={{ height: "100%", minWidth: "290px" }}
        >
          {rootNodes.map((node) => (
            <TreeNode2Component key={node.label} className="dataResourceTree" node={node} treeNodeId={node.label} />
          ))}
        </Tree>
      </FluentProvider>
    </>
  );
};