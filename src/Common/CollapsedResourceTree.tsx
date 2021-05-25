import React, { FunctionComponent } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";
import { userContext } from "../UserContext";

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
          <li
            className="resourceTreeCollapse"
            id="collapseToggleLeftPaneButton"
            role="button"
            tabIndex={0}
            aria-label="Expand Tree"
          >
            <span className="leftarrowCollapsed" onClick={toggleLeftPaneExpanded}>
              <img className="arrowCollapsed" src={arrowLeftImg} alt="Expand" />
            </span>
            <span className="collectionCollapsed" onClick={toggleLeftPaneExpanded}>
              <span>{userContext.apiType} API</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
