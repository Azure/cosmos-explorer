import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import QueryTab from "../Tabs/QueryTab";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";

export class SaveQueryPane extends ContextualPaneBase {
  public queryName: ko.Observable<string>;
  public canSaveQueries: ko.Computed<boolean>;
  public setupSaveQueriesText: string = `For compliance reasons, we save queries in a container in your Azure Cosmos account, in a separate database called “${Constants.SavedQueries.DatabaseName}”. To proceed, we need to create a container in your account, estimated additional cost is $0.77 daily.`;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Save Query");
    this.queryName = ko.observable<string>();
    this.canSaveQueries = this.container && this.container.canSaveQueries;
    this.resetData();
  }

  public submit = (): void => {
    this.formErrors("");
    this.formErrorsDetails("");
    if (!this.canSaveQueries()) {
      this.formErrors("Cannot save query");
      this.formErrorsDetails("Failed to save query: account not set up to save queries");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Failed to save query: account not setup to save queries"
      );
    }

    const queryName: string = this.queryName();
    const queryTab = this.container && (this.container.tabsManager.activeTab() as QueryTab);
    const query: string = queryTab && queryTab.sqlQueryEditorContent();
    if (!queryName || queryName.length === 0) {
      this.formErrors("No query name specified");
      this.formErrorsDetails("No query name specified. Please specify a query name.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not save query -- No query name specified. Please specify a query name."
      );
      return;
    } else if (!query || query.length === 0) {
      this.formErrors("Invalid query content specified");
      this.formErrorsDetails("Invalid query content specified. Please enter query content.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not save query -- Invalid query content specified. Please enter query content."
      );
      return;
    }

    const queryParam: DataModels.Query = {
      id: queryName,
      resourceId: this.container.queriesClient.getResourceId(),
      queryName: queryName,
      query: query
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.SaveQuery, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title()
    });
    this.isExecuting(true);
    this.container.queriesClient.saveQuery(queryParam).then(
      () => {
        this.isExecuting(false);
        queryTab.tabTitle(queryParam.queryName);
        queryTab.tabPath(`${queryTab.collection.databaseId}>${queryTab.collection.id()}>${queryParam.queryName}`);
        TelemetryProcessor.traceSuccess(
          Action.SaveQuery,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title()
          },
          startKey
        );
        this.close();
      },
      (error: any) => {
        this.isExecuting(false);
        const errorMessage = getErrorMessage(error);
        this.formErrors("Failed to save query");
        this.formErrorsDetails(`Failed to save query: ${errorMessage}`);
        TelemetryProcessor.traceFailure(
          Action.SaveQuery,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title(),
            error: errorMessage,
            errorStack: getErrorStack(error)
          },
          startKey
        );
      }
    );
  };

  public setupQueries = async (src: any, event: MouseEvent): Promise<void> => {
    if (!this.container) {
      return;
    }

    const startKey: number = TelemetryProcessor.traceStart(Action.SetupSavedQueries, {
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title()
    });
    try {
      this.isExecuting(true);
      await this.container.queriesClient.setupQueriesCollection();
      this.container.refreshAllDatabases();
      TelemetryProcessor.traceSuccess(
        Action.SetupSavedQueries,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ContextualPane,
          paneTitle: this.title()
        },
        startKey
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.SetupSavedQueries,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ContextualPane,
          paneTitle: this.title(),
          error: errorMessage,
          errorStack: getErrorStack(error)
        },
        startKey
      );
      this.formErrors("Failed to setup a container for saved queries");
      this.formErrorsDetails(`Failed to setup a container for saved queries: ${errorMessage}`);
    } finally {
      this.isExecuting(false);
    }
  };

  public close() {
    super.close();
    this.resetData();
  }

  public resetData() {
    super.resetData();
    this.queryName("");
  }
}
