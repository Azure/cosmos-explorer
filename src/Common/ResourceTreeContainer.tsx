import React, { FunctionComponent } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";
import refreshImg from "../../images/refresh-cosmos.svg";
import { AuthType } from "../AuthType";
import Explorer from "../Explorer/Explorer";
import { ResourceTokenTree } from "../Explorer/Tree/ResourceTokenTree";
import { ResourceTree } from "../Explorer/Tree/ResourceTree";
import { userContext } from "../UserContext";

export interface ResourceTreeContainerProps {
  toggleLeftPaneExpanded: () => void;
  isLeftPaneExpanded: boolean;
  container: Explorer;
}

export const ResourceTreeContainer: FunctionComponent<ResourceTreeContainerProps> = ({
  toggleLeftPaneExpanded,
  isLeftPaneExpanded,
  container,
}: ResourceTreeContainerProps): JSX.Element => {
  return (
    <div id="main" className={isLeftPaneExpanded ? "main" : "hiddenMain"}>
      {/* Collections Window - - Start */}
      <div id="mainslide" className="flexContainer">
        {/* Collections Window Title/Command Bar - Start */}
        <div className="collectiontitle">
          <div className="coltitle">
            <span className="titlepadcol">{userContext.apiType} API</span>
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
                <img className="refreshcol" src={refreshImg} alt="Refresh Tree" />
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
          <ResourceTokenTree />
        ) : userContext.features.enableKoResourceTree ? (
          <div style={{ overflowY: "auto" }} data-bind="react:resourceTree" />
        ) : (
          <ResourceTree container={container} />
        )}
      </div>
      {/*  Collections Window - End */}
    </div>
  );
};
