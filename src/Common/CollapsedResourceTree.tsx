import React, { FunctionComponent } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";

export interface CollapsedResourceTreeProps {
  toggleLeftPaneExpanded: () => void;
  isLeftPaneExpanded: boolean;
}

export const CollapsedResourceTree: FunctionComponent<CollapsedResourceTreeProps> = ({
  toggleLeftPaneExpanded,
  isLeftPaneExpanded,
}: CollapsedResourceTreeProps): JSX.Element => {
  return (
    <div id="mini" className={!isLeftPaneExpanded ? "mini toggle-mini" : "hiddenMain"}>
      <div className="main-nav nav">
        <ul className="nav">
          <li className="resourceTreeCollapse" id="collapseToggleLeftPaneButton" aria-label="Expand Tree">
            <span
              className="leftarrowCollapsed"
              onClick={toggleLeftPaneExpanded}
              role="button"
              tabIndex={0}
              onKeyDown={toggleLeftPaneExpanded}
            >
              <img className="arrowCollapsed" src={arrowLeftImg} alt="Expand" />
            </span>
            <span
              className="collectionCollapsed"
              onClick={toggleLeftPaneExpanded}
              role="button"
              tabIndex={0}
              onKeyDown={toggleLeftPaneExpanded}
            >
              <span data-bind="text: collectionTitle" />
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
