import React, { FunctionComponent, MutableRefObject, useEffect, useRef } from "react";
import arrowLeftImg from "../../images/imgarrowlefticon.svg";
import { getApiShortDisplayName } from "../Utils/APITypeUtils";
import { NormalizedEventKey } from "./Constants";

export interface CollapsedResourceTreeProps {
  toggleLeftPaneExpanded: () => void;
  isLeftPaneExpanded: boolean;
}

export const CollapsedResourceTree: FunctionComponent<CollapsedResourceTreeProps> = ({
  toggleLeftPaneExpanded,
  isLeftPaneExpanded,
}: CollapsedResourceTreeProps): JSX.Element => {
  const focusButton = useRef<HTMLLIElement>() as MutableRefObject<HTMLLIElement>;

  useEffect(() => {
    if (focusButton.current) {
      focusButton.current.focus();
    }
  });

  const onKeyPressToggleLeftPaneExpanded = (event: React.KeyboardEvent) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      toggleLeftPaneExpanded();
      event.stopPropagation();
    }
  };

  return (
    <div id="mini" className={!isLeftPaneExpanded ? "mini toggle-mini" : "hiddenMain"}>
      <div className="main-nav nav">
        <ul className="nav">
          <li
            className="resourceTreeCollapse"
            id="collapseToggleLeftPaneButton"
            role="button"
            tabIndex={0}
            aria-label={getApiShortDisplayName() + `Expand tree`}
            onClick={toggleLeftPaneExpanded}
            onKeyPress={onKeyPressToggleLeftPaneExpanded}
            ref={focusButton}
          >
            <span className="leftarrowCollapsed">
              <img className="arrowCollapsed" src={arrowLeftImg} alt="Expand" />
            </span>
            <span className="collectionCollapsed">
              <span>{getApiShortDisplayName()}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
