import { TreeNode } from "Explorer/Controls/TreeComponent/TreeComponent";
import { TreeNode2Component } from "Explorer/Controls/TreeComponent2/TreeNode2Component";
import Explorer from "Explorer/Explorer";
import * as React from "react";


interface DatabaseTreeProps {
  node: TreeNode;
  container: Explorer;
  treeNodeId: string;
}

/**
 * DATA tree for databases and containers
 */
export const DatabaseTreeItem: React.FC<DatabaseTreeProps> = ({ container, node, treeNodeId }: DatabaseTreeProps): JSX.Element => {
  // const containerTreeNodes = useContainerTreeNodes(container);

  // const databaseNode = {
  //   ...node,
  //   children: containerTreeNodes,
  // }

  return (
    <TreeNode2Component key={node.label} className="dataResourceTree" node={node} treeNodeId={node.label} />
  );
};