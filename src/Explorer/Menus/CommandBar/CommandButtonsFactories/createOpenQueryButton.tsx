import * as React from "react";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import BrowseQueriesIcon from "../../../../images/BrowseQuery.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { BrowseQueriesPane } from "../../../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { useSelectedNode } from "../../../useSelectedNode";

export function createOpenQueryButton(container: Explorer): CommandButtonComponentProps {
  const label = "Open Query";
  return {
    iconSrc: BrowseQueriesIcon,
    iconAlt: label,
    onCommandClick: () =>
      useSidePanel.getState().openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={container} />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
  };
}
