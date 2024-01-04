/**
 * Collapsible React component
 * Note:
 * If onCollapsedChanged() is triggered, parent container is responsible for:
 * - updating isCollapsed property
 * - calling render()
 */

import * as React from "react";
import LeftArrowIcon from "../../../../images/imgarrowlefticon.svg";
import { AccessibleElement } from "../../Controls/AccessibleElement/AccessibleElement";

export interface CollapsiblePanelProps {
  collapsedTitle: string;
  expandedTitle: string;
  isCollapsed: boolean;
  onCollapsedChanged: (newValue: boolean) => void;
  collapseToLeft?: boolean;
  children: JSX.Element | JSX.Element[];
}

export class CollapsiblePanel extends React.Component<CollapsiblePanelProps> {
  public render(): JSX.Element {
    return (
      <div className={`collapsiblePanel ${this.props.isCollapsed ? "paneCollapsed" : ""}`}>
        {!this.props.isCollapsed ? this.getExpandedFragment() : this.getCollapsedFragment()}
      </div>
    );
  }

  private toggleCollapse(): void {
    this.props.onCollapsedChanged(!this.props.isCollapsed);
  }

  private getCollapsedFragment(): JSX.Element {
    return (
      <div className="collapsibleNav nav">
        <ul className="nav">
          <li className="collapsedBtn collapseExpandButton">
            <AccessibleElement
              className="collapsedIconContainer"
              as="span"
              onActivated={() => this.toggleCollapse()}
              aria-label="Expand panel"
            >
              <img
                className={`collapsedIcon ${!this.props.isCollapsed ? "expanded" : ""} ${
                  this.props.collapseToLeft ? "iconMirror" : ""
                }`}
                src={LeftArrowIcon}
                alt="Expand"
              />
            </AccessibleElement>
            <AccessibleElement
              className="rotatedInner"
              as="span"
              onActivated={() => this.toggleCollapse()}
              aria-label="Expand panel"
            >
              <span>{this.props.collapsedTitle}</span>
            </AccessibleElement>
          </li>
        </ul>
      </div>
    );
  }

  private getExpandedFragment(): JSX.Element {
    return (
      <React.Fragment>
        <div className="panelHeader">
          <AccessibleElement
            as="span"
            className={`collapsedIconContainer collapseExpandButton ${this.props.collapseToLeft ? "pull-right" : ""}`}
            onActivated={() => this.toggleCollapse()}
            aria-label="Collapse panel"
          >
            <img
              className={`collapsedIcon imgVerticalAlignment ${!this.props.isCollapsed ? "expanded" : ""} ${
                this.props.collapseToLeft ? "iconMirror" : ""
              }`}
              src={LeftArrowIcon}
              alt="Collapse"
            />
          </AccessibleElement>
          <span className={`expandedTitle ${!this.props.collapseToLeft ? "iconSpacer" : ""}`}>
            {this.props.expandedTitle}
          </span>
        </div>
        <div className="panelContent">{this.props.children}</div>
      </React.Fragment>
    );
  }
}
