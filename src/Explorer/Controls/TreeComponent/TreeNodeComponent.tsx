import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuOpenChangeData,
  MenuOpenEvent,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Tree,
  TreeItem,
  TreeItemLayout,
  TreeItemValue,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
  mergeClasses,
} from "@fluentui/react-components";
import { ChevronDown20Regular, ChevronRight20Regular, MoreHorizontal20Regular } from "@fluentui/react-icons";
import { TreeStyleName, useTreeStyles } from "Explorer/Controls/TreeComponent/Styles";
import * as React from "react";
import { useCallback } from "react";

export interface TreeNodeMenuItem {
  label: string;
  onClick: (value?: React.RefObject<HTMLElement>) => void;
  iconSrc?: string;
  isDisabled?: boolean;
  styleClass?: string;
}

export interface TreeNode {
  label: string;
  id?: string;
  children?: TreeNode[];
  contextMenu?: TreeNodeMenuItem[];
  iconSrc?: string | JSX.Element;
  isExpanded?: boolean;
  className?: TreeStyleName;
  isAlphaSorted?: boolean;
  // data?: any; // Piece of data corresponding to this node
  timestamp?: number;
  isLeavesParentsSeparate?: boolean; // Display parents together first, then leaves
  isLoading?: boolean;
  isSelected?: () => boolean;
  onClick?: () => void; // Only if a leaf, other click will expand/collapse
  onExpanded?: () => Promise<void>;
  onCollapsed?: () => void;
  onContextMenuOpen?: () => void;
}

export interface TreeNodeComponentProps {
  node: TreeNode;
  className?: string;
  treeNodeId: string;
  openItems: TreeItemValue[];
}

/** Function that returns true if any descendant (at any depth) of this node is selected. */
function isAnyDescendantSelected(node: TreeNode): boolean {
  return (
    node.children &&
    node.children.reduce(
      (previous: boolean, child: TreeNode) =>
        previous || (child.isSelected && child.isSelected()) || isAnyDescendantSelected(child),
      false,
    )
  );
}

export const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  treeNodeId,
  openItems,
}: TreeNodeComponentProps): JSX.Element => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const contextMenuRef = React.useRef<HTMLButtonElement>(null);
  const treeStyles = useTreeStyles();

  const getSortedChildren = (treeNode: TreeNode): TreeNode[] => {
    if (!treeNode || !treeNode.children) {
      return undefined;
    }

    const compareFct = (a: TreeNode, b: TreeNode) => a.label.localeCompare(b.label);

    let unsortedChildren;
    if (treeNode.isLeavesParentsSeparate) {
      // Separate parents and leave
      const parents: TreeNode[] = treeNode.children.filter((node) => node.children);
      const leaves: TreeNode[] = treeNode.children.filter((node) => !node.children);

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

  // A branch node is any node with a defined children array, even if the array is empty.
  const isBranch = !!node.children;

  const onOpenChange = useCallback(
    (_: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
      if (data.type === "Click" && !isBranch && node.onClick) {
        node.onClick();
      }
      if (!node.isExpanded && data.open && node.onExpanded) {
        // Catch the transition non-expanded to expanded
        setIsLoading(true);
        node.onExpanded?.().then(() => setIsLoading(false));
      } else if (node.isExpanded && !data.open && node.onCollapsed) {
        // Catch the transition expanded to non-expanded
        node.onCollapsed?.();
      }
    },
    [isBranch, node, setIsLoading],
  );

  const onMenuOpenChange = useCallback(
    (e: MenuOpenEvent, data: MenuOpenChangeData) => {
      if (data.open) {
        node.onContextMenuOpen?.();
      }
    },
    [node],
  );

  // We show a node as selected if it is selected AND no descendant is selected.
  // We want to show only the deepest selected node as selected.
  const isCurrentNodeSelected = node.isSelected && node.isSelected();
  const shouldShowAsSelected = isCurrentNodeSelected && !isAnyDescendantSelected(node);

  const contextMenuItems = (node.contextMenu ?? []).map((menuItem) => (
    <MenuItem
      data-testid={`TreeNode/ContextMenuItem:${menuItem.label}`}
      disabled={menuItem.isDisabled}
      key={menuItem.label}
      onClick={() => menuItem.onClick(contextMenuRef)}
    >
      {menuItem.label}
    </MenuItem>
  ));

  // We use the expandIcon slot to hold the node icon too.
  // We only show a node icon for leaf nodes, even if a branch node has an iconSrc.
  const treeIcon =
    node.iconSrc === undefined ? undefined : typeof node.iconSrc === "string" ? (
      <img src={node.iconSrc} className={treeStyles.nodeIcon} alt="" />
    ) : (
      node.iconSrc
    );

  const expandIcon = isLoading ? (
    <Spinner size="extra-tiny" />
  ) : !isBranch ? undefined : openItems.includes(treeNodeId) ? (
    <ChevronDown20Regular data-testid="TreeNode/CollapseIcon" />
  ) : (
    <ChevronRight20Regular data-testid="TreeNode/ExpandIcon" />
  );

  const treeItem = (
    <TreeItem
      data-testid={`TreeNodeContainer:${treeNodeId}`}
      value={treeNodeId}
      itemType={isBranch ? "branch" : "leaf"}
      onOpenChange={onOpenChange}
      className={treeStyles.treeItem}
    >
      <TreeItemLayout
        className={mergeClasses(
          treeStyles.treeItemLayout,
          shouldShowAsSelected && treeStyles.selectedItem,
          node.className && treeStyles[node.className],
        )}
        data-testid={`TreeNode:${treeNodeId}`}
        actions={
          contextMenuItems.length > 0 && {
            className: treeStyles.actionsButtonContainer,
            children: (
              <Menu onOpenChange={onMenuOpenChange}>
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    aria-label="More options"
                    className={mergeClasses(treeStyles.actionsButton, shouldShowAsSelected && treeStyles.selectedItem)}
                    data-testid="TreeNode/ContextMenuTrigger"
                    appearance="subtle"
                    ref={contextMenuRef}
                    icon={<MoreHorizontal20Regular />}
                  />
                </MenuTrigger>
                <MenuPopover data-testid={`TreeNode/ContextMenu:${treeNodeId}`}>
                  <MenuList>{contextMenuItems}</MenuList>
                </MenuPopover>
              </Menu>
            ),
          }
        }
        iconBefore={treeIcon}
        expandIcon={expandIcon}
      >
        <span className={treeStyles.nodeLabel}>{node.label}</span>
      </TreeItemLayout>
      {!node.isLoading && node.children?.length > 0 && (
        <Tree data-testid={`Tree:${treeNodeId}`} className={treeStyles.tree}>
          {getSortedChildren(node).map((childNode: TreeNode) => (
            <TreeNodeComponent
              openItems={openItems}
              key={childNode.label}
              node={childNode}
              treeNodeId={`${treeNodeId}/${childNode.label}`}
            />
          ))}
        </Tree>
      )}
    </TreeItem>
  );

  if (contextMenuItems.length === 0) {
    return treeItem;
  }

  // For accessibility, it's highly recommended that any 'actions' also be available in the context menu.
  // See https://react.fluentui.dev/?path=/docs/components-tree--default#actions
  return (
    <Menu positioning="below-end" openOnContext onOpenChange={onMenuOpenChange}>
      <MenuTrigger disableButtonEnhancement>{treeItem}</MenuTrigger>
      <MenuPopover>
        <MenuList>{contextMenuItems}</MenuList>
      </MenuPopover>
    </Menu>
  );
};
