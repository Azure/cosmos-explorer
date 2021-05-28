import React, { FunctionComponent } from "react";
import { Areas } from "../../../Common/Constants";
import { logError } from "../../../Common/Logger";
import { Query } from "../../../Contracts/DataModels";
import { Collection } from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { trace } from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import {
  QueriesGridComponent,
  QueriesGridComponentProps,
} from "../../Controls/QueriesGridReactComponent/QueriesGridComponent";
import Explorer from "../../Explorer";
import { NewQueryTab } from "../../Tabs/QueryTab/QueryTab";

interface BrowseQueriesPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const BrowseQueriesPane: FunctionComponent<BrowseQueriesPaneProps> = ({
  explorer,
  closePanel,
}: BrowseQueriesPaneProps): JSX.Element => {
  const loadSavedQuery = (savedQuery: Query): void => {
    const selectedCollection: Collection = explorer && explorer.findSelectedCollection();
    if (!selectedCollection) {
      // should never get into this state because this pane is only accessible through the query tab
      logError("No collection was selected", "BrowseQueriesPane.loadSavedQuery");
      return;
    } else if (userContext.apiType === "Mongo") {
      selectedCollection.onNewMongoQueryClick(selectedCollection, undefined);
    } else {
      selectedCollection.onNewQueryClick(selectedCollection, undefined, savedQuery.query);
    }

    const queryTab = explorer && (explorer.tabsManager.activeTab() as NewQueryTab);
    queryTab.tabTitle(savedQuery.queryName);
    queryTab.tabPath(`${selectedCollection.databaseId}>${selectedCollection.id()}>${savedQuery.queryName}`);

    trace(Action.LoadSavedQuery, ActionModifiers.Mark, {
      dataExplorerArea: Areas.ContextualPane,
      queryName: savedQuery.queryName,
      paneTitle: "Open Saved Queries",
    });
    closePanel();
  };

  const props: QueriesGridComponentProps = {
    queriesClient: explorer.queriesClient,
    onQuerySelect: loadSavedQuery,
    containerVisible: true,
    saveQueryEnabled: explorer.canSaveQueries(),
  };

  return (
    <div className="panelFormWrapper">
      <div className="panelMainContent">
        <QueriesGridComponent {...props} />
      </div>
    </div>
  );
};
