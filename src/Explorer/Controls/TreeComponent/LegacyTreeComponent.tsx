/**
 * Tree component:
 * - collapsible
 * - icons prefix
 * - context menu
 */

import {
  DirectionalHint,
  IButtonStyles,
  IconButton,
  IContextualMenuItemProps,
  IContextualMenuProps,
} from "@fluentui/react";
import * as React from "react";
import AnimateHeight from "react-animate-height";
import LoadingIndicator_3Squares from "../../../../images/LoadingIndicator_3Squares.gif";
import TriangleDownIcon from "../../../../images/Triangle-down.svg";
import TriangleRightIcon from "../../../../images/Triangle-right.svg";
import * as Constants from "../../../Common/Constants";
import { StyleConstants } from "../../../Common/StyleConstants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";

export interface LegacyTreeNodeMenuItem {
  label: string;
  onClick: () => void;
  iconSrc?: string;
  isDisabled?: boolean;
  styleClass?: string;
}

export interface LegacyTreeNode {
  label: string;
  id?: string;
  children?: LegacyTreeNode[];
  contextMenu?: LegacyTreeNodeMenuItem[];
  iconSrc?: string;
  isExpanded?: boolean;
  className?: string;
  isAlphaSorted?: boolean;
  data?: any; // Piece of data corresponding to this node
  timestamp?: number;
  isLeavesParentsSeparate?: boolean; // Display parents together first, then leaves
  isLoading?: boolean;
  isSelected?: () => boolean;
  onClick?: (isExpanded: boolean) => void; // Only if a leaf, other click will expand/collapse
  onExpanded?: () => void;
  onCollapsed?: () => void;
  onContextMenuOpen?: () => void;
}

export interface LegacyTreeComponentProps {
  rootNode: LegacyTreeNode;
  style?: any;
  className?: string;
}

export class LegacyTreeComponent extends React.Component<LegacyTreeComponentProps> {
  public render(): JSX.Element {
    return (
      <div style={this.props.style} className={`treeComponent ${this.props.className}`} role="tree">
        <LegacyTreeNodeComponent paddingLeft={0} node={this.props.rootNode} generation={0} />
      </div>
    );
  }
}

/* Tree node is a react component */
interface LegacyTreeNodeComponentProps {
  node: LegacyTreeNode;
  generation: number;
  paddingLeft: number;
}

interface LegacyTreeNodeComponentState {
  isExpanded: boolean;
  isMenuShowing: boolean;
}
export class LegacyTreeNodeComponent extends React.Component<
  LegacyTreeNodeComponentProps,
  LegacyTreeNodeComponentState
> {
  private static readonly paddingPerGenerationPx = 16;
  private static readonly iconOffset = 22;
  private static readonly transitionDurationMS = 200;
  private static readonly callbackDelayMS = 100; // avoid calling at the same time as transition to make it smoother
  private contextMenuRef = React.createRef<HTMLDivElement>();
  private isExpanded: boolean;

  constructor(props: LegacyTreeNodeComponentProps) {
    super(props);
    this.isExpanded = props.node.isExpanded;
    this.state = {
      isExpanded: props.node.isExpanded,
      isMenuShowing: false,
    };
  }

  componentDidUpdate(prevProps: LegacyTreeNodeComponentProps, prevState: LegacyTreeNodeComponentState) {
    // Only call when expand has actually changed
    if (this.state.isExpanded !== prevState.isExpanded) {
      if (this.state.isExpanded) {
        this.props.node.onExpanded && setTimeout(this.props.node.onExpanded, LegacyTreeNodeComponent.callbackDelayMS);
      } else {
        this.props.node.onCollapsed && setTimeout(this.props.node.onCollapsed, LegacyTreeNodeComponent.callbackDelayMS);
      }
    }
    if (this.props.node.isExpanded !== this.isExpanded) {
      this.isExpanded = this.props.node.isExpanded;
      this.setState({
        isExpanded: this.props.node.isExpanded,
      });
    }
  }

  public render(): JSX.Element {
    return this.renderNode(this.props.node, this.props.generation);
  }

  private static getSortedChildren(treeNode: LegacyTreeNode): LegacyTreeNode[] {
    if (!treeNode || !treeNode.children) {
      return undefined;
    }

    const compareFct = (a: LegacyTreeNode, b: LegacyTreeNode) => a.label.localeCompare(b.label);

    let unsortedChildren;
    if (treeNode.isLeavesParentsSeparate) {
      // Separate parents and leave
      const parents: LegacyTreeNode[] = treeNode.children.filter((node) => node.children);
      const leaves: LegacyTreeNode[] = treeNode.children.filter((node) => !node.children);

      if (treeNode.isAlphaSorted) {
        parents.sort(compareFct);
        leaves.sort(compareFct);
      }

      unsortedChildren = parents.concat(leaves);
    } else {
      unsortedChildren = treeNode.isAlphaSorted ? treeNode.children.sort(compareFct) : treeNode.children;
    }

    return unsortedChildren;
  }

  private static isNodeHeaderBlank(node: LegacyTreeNode): boolean {
    return (node.label === undefined || node.label === null) && !node.contextMenu;
  }

  private renderNode(node: LegacyTreeNode, generation: number): JSX.Element {
    let paddingLeft = generation * LegacyTreeNodeComponent.paddingPerGenerationPx;
    let additionalOffsetPx = 15;

    if (node.children) {
      const childrenWithSubChildren = node.children.filter((child: LegacyTreeNode) => !!child.children);
      if (childrenWithSubChildren.length > 0) {
        additionalOffsetPx = LegacyTreeNodeComponent.iconOffset;
      }
    }

    // Don't show as selected if any of the children is selected
    const showSelected =
      this.props.node.isSelected &&
      this.props.node.isSelected() &&
      !LegacyTreeNodeComponent.isAnyDescendantSelected(this.props.node);

    const headerStyle: React.CSSProperties = { paddingLeft: this.props.paddingLeft };
    if (LegacyTreeNodeComponent.isNodeHeaderBlank(node)) {
      headerStyle.height = 0;
      headerStyle.padding = 0;
    }

    return (
      <div
        className={`${this.props.node.className || ""} main${generation} nodeItem ${showSelected ? "selected" : ""}`}
        onClick={(event: React.MouseEvent<HTMLDivElement>) => this.onNodeClick(event, node)}
        onKeyPress={(event: React.KeyboardEvent<HTMLDivElement>) => this.onNodeKeyPress(event, node)}
        role="treeitem"
        id={node.id}
      >
        <div
          className={`treeNodeHeader ${this.state.isMenuShowing ? "showingMenu" : ""}`}
          style={headerStyle}
          tabIndex={node.children ? -1 : 0}
          data-test={node.label}
        >
          {this.renderCollapseExpandIcon(node)}
          {node.iconSrc && <img className="nodeIcon" src={node.iconSrc} alt="" />}
          {node.label && (
            <span className="nodeLabel" title={node.label}>
              {node.label}
            </span>
          )}
          {node.contextMenu && this.renderContextMenuButton(node)}
        </div>
        <div className="loadingIconContainer">
          <img className="loadingIcon" src={LoadingIndicator_3Squares} hidden={!this.props.node.isLoading} />
        </div>
        {node.children && (
          <AnimateHeight
            duration={LegacyTreeNodeComponent.transitionDurationMS}
            height={this.state.isExpanded ? "auto" : 0}
          >
            <div className="nodeChildren" data-test={node.label} role="group">
              {LegacyTreeNodeComponent.getSortedChildren(node).map((childNode: LegacyTreeNode) => (
                <LegacyTreeNodeComponent
                  key={`${childNode.label}-${generation + 1}-${childNode.timestamp}`}
                  node={childNode}
                  generation={generation + 1}
                  paddingLeft={paddingLeft + (!childNode.children && !childNode.iconSrc ? additionalOffsetPx : 0)}
                />
              ))}
            </div>
          </AnimateHeight>
        )}
      </div>
    );
  }

  /**
   * Recursive: is the node or any descendant selected
   * @param node
   */
  private static isAnyDescendantSelected(node: LegacyTreeNode): boolean {
    return (
      node.children &&
      node.children.reduce(
        (previous: boolean, child: LegacyTreeNode) =>
          previous ||
          (child.isSelected && child.isSelected()) ||
          LegacyTreeNodeComponent.isAnyDescendantSelected(child),
        false,
      )
    );
  }

  private static createClickEvent(): MouseEvent {
    return new MouseEvent("click", { bubbles: true, view: window, cancelable: true });
  }

  private onRightClick = (): void => {
    this.contextMenuRef.current.firstChild.dispatchEvent(LegacyTreeNodeComponent.createClickEvent());
  };

  private renderContextMenuButton(node: LegacyTreeNode): JSX.Element {
    const menuItemLabel = "More";
    const buttonStyles: Partial<IButtonStyles> = {
      rootFocused: { outline: `1px dashed ${StyleConstants.FocusColor}` },
    };

    return (
      <div ref={this.contextMenuRef} onContextMenu={this.onRightClick} onKeyPress={this.onMoreButtonKeyPress}>
        <IconButton
          name="More"
          title="More"
          className="treeMenuEllipsis"
          ariaLabel={`${menuItemLabel} options`}
          menuIconProps={{
            iconName: menuItemLabel,
            styles: { root: { fontSize: "18px", fontWeight: "bold" } },
          }}
          menuProps={{
            coverTarget: true,
            isBeakVisible: false,
            directionalHint: DirectionalHint.topAutoEdge,
            onMenuOpened: (contextualMenu?: IContextualMenuProps) => {
              this.setState({ isMenuShowing: true });
              node.onContextMenuOpen && node.onContextMenuOpen();
            },
            onMenuDismissed: (contextualMenu?: IContextualMenuProps) => this.setState({ isMenuShowing: false }),
            contextualMenuItemAs: (props: IContextualMenuItemProps) => (
              <div
                data-test={`treeComponentMenuItemContainer`}
                className="treeComponentMenuItemContainer"
                onContextMenu={(e) => e.target.dispatchEvent(LegacyTreeNodeComponent.createClickEvent())}
              >
                {props.item.onRenderIcon()}
                <span
                  className={
                    "treeComponentMenuItemLabel" + (props.item.className ? ` ${props.item.className}Label` : "")
                  }
                >
                  {props.item.text}
                </span>
              </div>
            ),
            items: node.contextMenu.map((menuItem: LegacyTreeNodeMenuItem) => ({
              key: menuItem.label,
              text: menuItem.label,
              disabled: menuItem.isDisabled,
              className: menuItem.styleClass,
              onClick: () => {
                menuItem.onClick();
                TelemetryProcessor.trace(Action.ClickResourceTreeNodeContextMenuItem, ActionModifiers.Mark, {
                  label: menuItem.label,
                });
              },
              onRenderIcon: (props: any) => <img src={menuItem.iconSrc} alt="" />,
            })),
          }}
          styles={buttonStyles}
        />
      </div>
    );
  }

  private renderCollapseExpandIcon(node: LegacyTreeNode): JSX.Element {
    if (!node.children || !node.label) {
      return <></>;
    }

    return (
      <img
        className="expandCollapseIcon"
        src={this.state.isExpanded ? TriangleDownIcon : TriangleRightIcon}
        alt={this.state.isExpanded ? `${node.label} branch is expanded` : `${node.label} branch is collapsed`}
        onKeyPress={(event: React.KeyboardEvent<HTMLDivElement>) => this.onCollapseExpandIconKeyPress(event, node)}
        tabIndex={0}
        role="button"
      />
    );
  }

  private onNodeClick = (event: React.MouseEvent<HTMLDivElement>, node: LegacyTreeNode): void => {
    event.stopPropagation();
    if (node.children) {
      const isExpanded = !this.state.isExpanded;
      // Prevent collapsing if node header is blank
      if (!(LegacyTreeNodeComponent.isNodeHeaderBlank(node) && !isExpanded)) {
        this.setState({ isExpanded });
      }
    }

    this.props.node.onClick && this.props.node.onClick(this.state.isExpanded);
  };

  private onNodeKeyPress = (event: React.KeyboardEvent<HTMLDivElement>, node: LegacyTreeNode): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      this.props.node.onClick && this.props.node.onClick(this.state.isExpanded);
    }
  };

  private onCollapseExpandIconKeyPress = (event: React.KeyboardEvent<HTMLDivElement>, node: LegacyTreeNode): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      if (node.children) {
        this.setState({ isExpanded: !this.state.isExpanded });
      }
    }
  };

  private onMoreButtonKeyPress = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
    }
  };
}
