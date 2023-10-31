import * as React from "react";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import OpenQueryFromDiskIcon from "../../../../images/OpenQueryFromDisk.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import { LoadQueryPane } from "../../../Panes/LoadQueryPane/LoadQueryPane";
import { useSelectedNode } from "../../../useSelectedNode";

export function createOpenQueryFromDiskButton(): CommandButtonComponentProps {
  const label = "Open Query From Disk";
  return {
    iconSrc: OpenQueryFromDiskIcon,
    iconAlt: label,
    onCommandClick: () => useSidePanel.getState().openSidePanel("Load Query", <LoadQueryPane />),
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
  };
}
