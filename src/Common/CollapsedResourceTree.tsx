import React, { FunctionComponent } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";


export interface CollapsedResourceTreeProps {
  toggleLeftPaneExpanded: () => void;
  isLeftPaneExpanded: boolean;
}

export const CollapsedResourceTree: FunctionComponent<CollapsedResourceTreeProps> = ({
  toggleLeftPaneExpanded,
  isLeftPaneExpanded
}: CollapsedResourceTreeProps): JSX.Element => {
  return (
    <div
      id="mini"
      // className="mini toggle-mini"
      className={!isLeftPaneExpanded ? "mini toggle-mini" : "hiddenMain"}
    // data-bind="visible: !isLeftPaneExpanded()
    //     attr: { style: { width: collapsedResourceTreeWidth }}"
    >
      <div className="main-nav nav">
        <ul className="nav">
          <li
            className="resourceTreeCollapse"
            id="collapseToggleLeftPaneButton"
            role="button"
            // data-bind="event: { keypress: toggleLeftPaneExpandedKeyPress }"
            tabIndex={0}
            aria-label="Expand Tree"
          >
            <span
              className="leftarrowCollapsed"
              // data-bind="click: toggleLeftPaneExpanded"
              onClick={toggleLeftPaneExpanded}
            >
              <img className="arrowCollapsed" src={arrowLeftImg} alt="Expand" />
            </span>
            <span
              className="collectionCollapsed"
              // data-bind="click: toggleLeftPaneExpanded"
              onClick={toggleLeftPaneExpanded}

            >
              <span
                data-bind="text: collectionTitle"
              />
            </span>
          </li>
        </ul>
      </div>
    </div>
};
