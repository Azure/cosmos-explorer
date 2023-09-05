import { ResourceTree2 } from "Explorer/Tree2/ResourceTree";
import React, { FunctionComponent, MutableRefObject, useEffect, useRef } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";
import refreshImg from "../../images/refresh-cosmos.svg";
import { AuthType } from "../AuthType";
import Explorer from "../Explorer/Explorer";
import { ResourceTokenTree } from "../Explorer/Tree/ResourceTokenTree";
import { userContext } from "../UserContext";
import { getApiShortDisplayName } from "../Utils/APITypeUtils";
import { NormalizedEventKey } from "./Constants";

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
  const focusButton = useRef<HTMLLIElement>() as MutableRefObject<HTMLLIElement>;

  useEffect(() => {
    if (isLeftPaneExpanded) {
      if (focusButton.current) {
        focusButton.current.focus();
      }
    }
  });

  const onKeyPressToggleLeftPaneExpanded = (event: React.KeyboardEvent) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      toggleLeftPaneExpanded();
      event.stopPropagation();
    }
  };
  return (
    <div id="main" className={isLeftPaneExpanded ? "main" : "hiddenMain"}>
      {/* Collections Window - - Start */}
      <div id="mainslide" className="flexContainer">
        {/* Collections Window Title/Command Bar - Start */}
        <div className="collectiontitle">
          <div className="coltitle">
            <span className="titlepadcol">{getApiShortDisplayName()}</span>
            <div className="float-right">
              <span
                className="padimgcolrefresh"
                data-test="refreshTree"
                role="button"
                data-bind="click: onRefreshResourcesClick, clickBubble: false, event: { keypress: onRefreshDatabasesKeyPress }"
                tabIndex={0}
                aria-label={getApiShortDisplayName() + `Refresh tree`}
                title="Refresh tree"
              >
                <img className="refreshcol" src={refreshImg} alt="Refresh Tree" />
              </span>
              <span
                className="padimgcolrefresh1"
                id="expandToggleLeftPaneButton"
                role="button"
                onClick={toggleLeftPaneExpanded}
                onKeyPress={onKeyPressToggleLeftPaneExpanded}
                tabIndex={0}
                aria-label={getApiShortDisplayName() + `Collapse Tree`}
                title="Collapse Tree"
                ref={focusButton}
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
          <ResourceTree2 container={container} />
        )}
      </div>
      {/*  Collections Window - End */}
    </div>
  );
};
