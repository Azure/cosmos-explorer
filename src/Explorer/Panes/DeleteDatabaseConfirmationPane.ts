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

import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import { ARMError } from "../../Utils/arm/request";

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
    // TODO: Should not be a Q promise anymore, but the Cassandra code requires it
    let promise: Q.Promise<any>;
    if (this.container.isPreferredApiCassandra()) {
      promise = (<CassandraAPIDataClient>this.container.tableDataClient).deleteTableOrKeyspace(
        this.container.databaseAccount().properties.cassandraEndpoint,
        this.container.databaseAccount().id,
        `DROP KEYSPACE ${selectedDatabase.id()};`,
        this.container
      );
    } else {
      promise = Q(deleteDatabase(selectedDatabase.id()));
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
      (reason: unknown) => {
        this.isExecuting(false);

        const message = reason instanceof ARMError ? reason.message : ErrorParserUtility.parse(reason)[0].message;
        this.formErrors(message);
        this.formErrorsDetails(message);
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

  public async open() {
    await this.container.loadSelectedDatabaseOffer();
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
