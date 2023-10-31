import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceOpen } from "Shared/Telemetry/TelemetryProcessor";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import AddSqlQueryIcon from "../../../../images/AddSqlQuery_16x16.svg";
import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import { SelectedNodeState, useSelectedNode } from "../../../useSelectedNode";

export function createNewSQLQueryButton(selectedNodeState: SelectedNodeState): CommandButtonComponentProps {
  if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
    const label = "New SQL Query";
    return {
      id: "newQueryBtn",
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      onCommandClick: () => {
        if (useSelectedNode.getState().isQueryCopilotCollectionSelected()) {
          useTabs.getState().openAndActivateReactTab(ReactTabKind.QueryCopilot);
          traceOpen(Action.OpenQueryCopilotFromNewQuery, { apiType: userContext.apiType });
        } else {
          const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
          selectedCollection && selectedCollection.onNewQueryClick(selectedCollection);
        }
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
  } else if (userContext.apiType === "Mongo") {
    const label = "New Query";
    return {
      id: "newQueryBtn",
      iconSrc: AddSqlQueryIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = selectedNodeState.findSelectedCollection();
        selectedCollection && selectedCollection.onNewMongoQueryClick(selectedCollection);
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: selectedNodeState.isDatabaseNodeOrNoneSelected(),
    };
  }

  return undefined;
}
