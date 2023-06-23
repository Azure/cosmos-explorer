import { getSampleDataTreeRoot } from "Explorer/Tree/getSampleDataTreeRoot";
import React from "react";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";

export const SampleDataTree: React.FC = (): JSX.Element => {
  const root: TreeNode = getSampleDataTreeRoot();

  return <>
    <TreeComponent className="sampleDataResourceTree" rootNode={root} />
  </>;
}
