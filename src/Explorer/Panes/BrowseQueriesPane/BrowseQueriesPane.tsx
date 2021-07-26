import React, { FunctionComponent } from "react";
import { Areas } from "../../../Common/Constants";
import { logError } from "../../../Common/Logger";
import { Query } from "../../../Contracts/DataModels";
import { Collection } from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { useTabs } from "../../../hooks/useTabs";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { trace } from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import {
  QueriesGridComponent,
  QueriesGridComponentProps,
} from "../../Controls/QueriesGridReactComponent/QueriesGridComponent";
import Explorer from "../../Explorer";
import { NewQueryTab } from "../../Tabs/QueryTab/QueryTab";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";

interface BrowseQueriesPaneProps {
  explorer: Explorer;
}

export const BrowseQueriesPane: FunctionComponent<BrowseQueriesPaneProps> = ({
  explorer,
}: BrowseQueriesPaneProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const loadSavedQuery = (savedQuery: Query): void => {
    const selectedCollection: Collection = useSelectedNode.getState().findSelectedCollection();
    if (!selectedCollection) {
      // should never get into this state because this pane is only accessible through the query tab
      logError("No collection was selected", "BrowseQueriesPane.loadSavedQuery");
      return;
    } else if (userContext.apiType === "Mongo") {
      selectedCollection.onNewMongoQueryClick(selectedCollection, undefined);
    } else {
      selectedCollection.onNewQueryClick(selectedCollection, undefined, savedQuery.query);
    }

    const queryTab = useTabs.getState().activeTab as NewQueryTab;
    queryTab.tabTitle(savedQuery.queryName);
    queryTab.tabPath(`${selectedCollection.databaseId}>${selectedCollection.id()}>${savedQuery.queryName}`);

    trace(Action.LoadSavedQuery, ActionModifiers.Mark, {
      dataExplorerArea: Areas.ContextualPane,
      queryName: savedQuery.queryName,
      paneTitle: "Open Saved Queries",
    });
    closeSidePanel();
  };
  const isSaveQueryEnabled = useDatabases((state) => state.isSaveQueryEnabled);

  const props: QueriesGridComponentProps = {
    queriesClient: explorer.queriesClient,
    onQuerySelect: loadSavedQuery,
    containerVisible: true,
    saveQueryEnabled: isSaveQueryEnabled(),
  };

  return (
    <div className="panelFormWrapper">
      <div className="panelMainContent">
        <QueriesGridComponent {...props} />
      </div>
    </div>
  );
};
