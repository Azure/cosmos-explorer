import * as ko from "knockout";
import Q from "q";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import { CassandraAPIDataClient } from "../Tables/TableDataClient";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import DeleteFeedback from "../../Common/DeleteFeedback";

import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { deleteDatabase } from "../../Common/DocumentClientUtilityBase";

export default class DeleteDatabaseConfirmationPane extends ContextualPaneBase {
  public databaseIdConfirmationText: ko.Observable<string>;
  public databaseIdConfirmation: ko.Observable<string>;
  public databaseDeleteFeedback: ko.Observable<string>;
  public recordDeleteFeedback: ko.Observable<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.databaseIdConfirmationText = ko.observable<string>("Confirm by typing the database id");
    this.databaseIdConfirmation = ko.observable<string>();
    this.databaseDeleteFeedback = ko.observable<string>();
    this.recordDeleteFeedback = ko.observable<boolean>(false);
    this.title("Delete Database");
    this.resetData();
  }

  public submit(): Q.Promise<any> {
    if (!this._isValid()) {
      const selectedDatabase: ViewModels.Database = this.container.findSelectedDatabase();
      this.formErrors("Input database name does not match the selected database");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error while deleting collection ${selectedDatabase && selectedDatabase.id()}: ${this.formErrors()}`
      );
      return Q.resolve();
    }

    this.formErrors("");
    this.isExecuting(true);
    const selectedDatabase = this.container.findSelectedDatabase();
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDatabase, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      databaseId: selectedDatabase.id(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title()
    });
    let promise: Q.Promise<any>;
    if (this.container.isPreferredApiCassandra()) {
      promise = (<CassandraAPIDataClient>this.container.tableDataClient).deleteTableOrKeyspace(
        this.container.databaseAccount().properties.cassandraEndpoint,
        this.container.databaseAccount().id,
        `DROP KEYSPACE ${selectedDatabase.id()};`,
        this.container
      );
    } else {
      promise = deleteDatabase(selectedDatabase);
    }
    return promise.then(
      () => {
        this.isExecuting(false);
        this.close();
        this.container.refreshAllDatabases();
        this.container.tabsManager.closeTabsByComparator(tab => tab.node && tab.node.rid === selectedDatabase.rid);
        this.container.selectedNode(null);
        selectedDatabase
          .collections()
          .forEach((collection: ViewModels.Collection) =>
            this.container.tabsManager.closeTabsByComparator(tab => tab.node && tab.node.rid === collection.rid)
          );
        this.resetData();
        TelemetryProcessor.traceSuccess(
          Action.DeleteDatabase,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            databaseId: selectedDatabase.id(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title()
          },
          startKey
        );

        if (this.shouldRecordFeedback()) {
          let deleteFeedback = new DeleteFeedback(
            this.container.databaseAccount().id,
            this.container.databaseAccount().name,
            DefaultExperienceUtility.getApiKindFromDefaultExperience(this.container.defaultExperience()),
            this.databaseDeleteFeedback()
          );

          TelemetryProcessor.trace(
            Action.DeleteDatabase,
            ActionModifiers.Mark,
            JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback))
          );

          this.databaseDeleteFeedback("");
        }
      },
      (reason: any) => {
        this.isExecuting(false);
        const message = ErrorParserUtility.parse(reason);
        this.formErrors(message[0].message);
        this.formErrorsDetails(message[0].message);
        TelemetryProcessor.traceFailure(
          Action.DeleteDatabase,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            databaseId: selectedDatabase.id(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title()
          },
          startKey
        );
      }
    );
  }

  public resetData() {
    this.databaseIdConfirmation("");
    super.resetData();
  }

  public open() {
    this.recordDeleteFeedback(this.shouldRecordFeedback());
    super.open();
  }

  public shouldRecordFeedback(): boolean {
    return (
      this.container.isLastNonEmptyDatabase() ||
      (this.container.isLastDatabase() && this.container.isSelectedDatabaseShared())
    );
  }

  private _isValid(): boolean {
    const selectedDatabase = this.container.findSelectedDatabase();
    if (!selectedDatabase) {
      return false;
    }

    return this.databaseIdConfirmation() === selectedDatabase.id();
  }
}
