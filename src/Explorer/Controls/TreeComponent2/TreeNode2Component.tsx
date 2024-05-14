import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Tree,
  TreeItem,
  TreeItemLayout,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
} from "@fluentui/react-components";
import { MoreHorizontal20Regular } from "@fluentui/react-icons";
import { tokens } from "@fluentui/react-theme";
import * as React from "react";

export interface TreeNode2MenuItem {
  label: string;
  onClick: () => void;
  iconSrc?: string;
  isDisabled?: boolean;
  styleClass?: string;
}

export interface TreeNode2 {
  label: string;
  id?: string;
  children?: TreeNode2[];
  contextMenu?: TreeNode2MenuItem[];
  iconSrc?: string;
  isExpanded?: boolean;
  className?: string;
  isAlphaSorted?: boolean;
  // data?: any; // Piece of data corresponding to this node
  timestamp?: number;
  isLeavesParentsSeparate?: boolean; // Display parents together first, then leaves
  isLoading?: boolean;
  isScrollable?: boolean;
  isSelected?: () => boolean;
  onClick?: () => void; // Only if a leaf, other click will expand/collapse
  onExpanded?: () => Promise<void>;
  onCollapsed?: () => void;
  onContextMenuOpen?: () => void;
}

export interface TreeNode2ComponentProps {
  node: TreeNode2;
  className?: string;
  treeNodeId: string;
}

const getTreeIcon = (iconSrc: string): JSX.Element => <img src={iconSrc} alt="" style={{ width: 20, height: 20 }} />;

export const TreeNode2Component: React.FC<TreeNode2ComponentProps> = ({
  node,
  treeNodeId,
}: TreeNode2ComponentProps): JSX.Element => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const getSortedChildren = (treeNode: TreeNode2): TreeNode2[] => {
    if (!treeNode || !treeNode.children) {
      return undefined;
    }

    const compareFct = (a: TreeNode2, b: TreeNode2) => a.label.localeCompare(b.label);

    let unsortedChildren;
    if (treeNode.isLeavesParentsSeparate) {
      // Separate parents and leave
      const parents: TreeNode2[] = treeNode.children.filter((node) => node.children);
      const leaves: TreeNode2[] = treeNode.children.filter((node) => !node.children);

      if (treeNode.isAlphaSorted) {
        parents.sort(compareFct);
        leaves.sort(compareFct);
      }

      unsortedChildren = parents.concat(leaves);
    } else {
      unsortedChildren = treeNode.isAlphaSorted ? treeNode.children.sort(compareFct) : treeNode.children;
    }

    return unsortedChildren;
  };

  const onOpenChange = (_: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
    if (!node.isExpanded && data.open && node.onExpanded) {
      // Catch the transition non-expanded to expanded
      setIsLoading(true);
      node.onExpanded?.().then(() => setIsLoading(false));
    } else if (node.isExpanded && !data.open && node.onCollapsed) {
      // Catch the transition expanded to non-expanded
      node.onCollapsed?.();
    }
  };

  return (
    <TreeItem
      value={treeNodeId}
      itemType={node.children !== undefined ? "branch" : "leaf"}
      style={{ height: "100%" }}
      onOpenChange={onOpenChange}
    >
      <TreeItemLayout
        className={node.className}
        actions={
          node.contextMenu && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button aria-label="More options" appearance="subtle" icon={<MoreHorizontal20Regular />} />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {node.contextMenu.map((menuItem) => (
                    <MenuItem disabled={menuItem.isDisabled} key={menuItem.label} onClick={menuItem.onClick}>
                      {menuItem.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          )
        }
        expandIcon={isLoading ? <Spinner size="extra-tiny" /> : undefined}
        iconBefore={node.iconSrc && getTreeIcon(node.iconSrc)}
        style={{
          backgroundColor: node.isSelected && node.isSelected() ? tokens.colorNeutralBackground1Selected : undefined,
        }}
        onClick={() => node.onClick?.()}
      >
        {node.label}
      </TreeItemLayout>
      {!node.isLoading && node.children?.length > 0 && (
        <Tree style={{ overflow: node.isScrollable ? "auto" : undefined }}>
          {getSortedChildren(node).map((childNode: TreeNode2) => (
            <TreeNode2Component
              key={childNode.label}
              node={childNode}
              treeNodeId={`${treeNodeId}/${childNode.label}`}
            />
          ))}
        </Tree>
      )}
    </TreeItem>
  );
};
