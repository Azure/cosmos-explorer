import React from "react";
import { AccordionComponent, AccordionItemComponent } from "../Controls/Accordion/AccordionComponent";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";

interface RootNodeProps {
  rootNode: TreeNode;
  title: string;
  className: string;
  isExpanded: boolean;
}

export interface GenericResourceTreeProps {
  rootNodes: RootNodeProps[];
}

export const GenericResourceTree: React.FC<GenericResourceTreeProps> = ({
  rootNodes,
}: GenericResourceTreeProps): JSX.Element => {
  return (
    <AccordionComponent>
      {rootNodes.map((rootNodeProps: RootNodeProps) => {
        <AccordionItemComponent title={rootNodeProps.title} isExpanded={rootNodeProps.isExpanded}>
          <TreeComponent className={rootNodeProps.className} rootNode={rootNodeProps.rootNode} />
        </AccordionItemComponent>;
      })}
    </AccordionComponent>
  );
};
