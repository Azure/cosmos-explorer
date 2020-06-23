import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../Common/Constants";
import { ContextualPaneBase } from "./ContextualPaneBase";
import * as Logger from "../../Common/Logger";
import { QueriesGridComponentAdapter } from "../Controls/QueriesGridReactComponent/QueriesGridComponentAdapter";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

export class BrowseQueriesPane extends ContextualPaneBase implements ViewModels.BrowseQueriesPane {
  public queriesGridComponentAdapter: QueriesGridComponentAdapter;
  public canSaveQueries: ko.Computed<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Open Saved Queries");
    this.resetData();
    this.canSaveQueries = this.container && this.container.canSaveQueries;
    this.queriesGridComponentAdapter = new QueriesGridComponentAdapter(this.container);
  }

  public open() {
    super.open();
    this.queriesGridComponentAdapter.forceRender();
  }

  public close() {
    super.close();
    this.queriesGridComponentAdapter.forceRender();
  }

  public submit() {
    // override default behavior because this is not a form
  }

  public setupQueries = async (src: any, event: MouseEvent): Promise<void> => {
    if (!this.container) {
      return;
    }

    const startKey: number = TelemetryProcessor.traceStart(Action.SetupSavedQueries, {
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: this.title()
    });
    try {
      this.isExecuting(true);
      await this.container.queriesClient.setupQueriesCollection();
      this.container.refreshAllDatabases().done(() => this.queriesGridComponentAdapter.forceRender());
      TelemetryProcessor.traceSuccess(
        Action.SetupSavedQueries,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title()
        },
        startKey
      );
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.SetupSavedQueries,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title()
        },
        startKey
      );
      this.formErrors("Failed to setup a collection for saved queries");
      this.formErrors(`Failed to setup a collection for saved queries: ${JSON.stringify(error)}`);
    } finally {
      this.isExecuting(false);
    }
  };

  public loadSavedQuery = (savedQuery: DataModels.Query): void => {
    const selectedCollection: ViewModels.Collection = this.container && this.container.findSelectedCollection();
    if (!selectedCollection) {
      // should never get into this state because this pane is only accessible through the query tab
      Logger.logError("No collection was selected", "BrowseQueriesPane.loadSavedQuery");
      return;
    } else if (this.container.isPreferredApiMongoDB()) {
      selectedCollection.onNewMongoQueryClick(selectedCollection, null);
    } else {
      selectedCollection.onNewQueryClick(selectedCollection, null);
    }
    const queryTab: ViewModels.QueryTab = this.container.findActiveTab() as ViewModels.QueryTab;
    queryTab.tabTitle(savedQuery.queryName);
    queryTab.tabPath(`${selectedCollection.databaseId}>${selectedCollection.id()}>${savedQuery.queryName}`);
    queryTab.initialEditorContent(savedQuery.query);
    queryTab.sqlQueryEditorContent(savedQuery.query);
    TelemetryProcessor.trace(Action.LoadSavedQuery, ActionModifiers.Mark, {
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Areas.ContextualPane,
      queryName: savedQuery.queryName,
      paneTitle: this.title()
    });
    this.close();
  };
}
