import React, { FunctionComponent } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";
import refreshImg from "../../images/refresh-cosmos.svg";
import { AuthType } from "../AuthType";
import { userContext } from "../UserContext";

export interface ResourceTreeProps {
  toggleLeftPaneExpanded: () => void;
  isLeftPaneExpanded: boolean;
}

export const ResourceTree: FunctionComponent<ResourceTreeProps> = ({
  toggleLeftPaneExpanded,
  isLeftPaneExpanded,
}: ResourceTreeProps): JSX.Element => {
  return (
    <div id="main" className={isLeftPaneExpanded ? "main" : "hiddenMain"}>
      {/* Collections Window - - Start */}
      <div id="mainslide" className="flexContainer">
        {/* Collections Window Title/Command Bar - Start */}
        <div className="collectiontitle">
          <div className="coltitle">
            <span className="titlepadcol" data-bind="text: collectionTitle" />
            <div className="float-right">
              <span
                className="padimgcolrefresh"
                data-test="refreshTree"
                role="button"
                data-bind="click: onRefreshResourcesClick, clickBubble: false, event: { keypress: onRefreshDatabasesKeyPress }"
                tabIndex={0}
                aria-label="Refresh tree"
                title="Refresh tree"
              >
                <img className="refreshcol" src={refreshImg} alt="Refresh tree" />
              </span>
              <span
                className="padimgcolrefresh1"
                id="expandToggleLeftPaneButton"
                role="button"
                onClick={toggleLeftPaneExpanded}
                tabIndex={0}
                aria-label="Collapse Tree"
                title="Collapse Tree"
              >
                <img className="refreshcol1" src={arrowLeftImg} alt="Hide" />
              </span>
            </div>
          </div>
        </div>
        {userContext.authType === AuthType.ResourceToken ? (
          <div style={{ overflowY: "auto" }} data-bind="react:resourceTreeForResourceToken" />
        ) : (
          <div style={{ overflowY: "auto" }} data-bind="react:resourceTree" />
        )}
      </div>
      {/*  Collections Window - End */}
    </div>
  );
};
