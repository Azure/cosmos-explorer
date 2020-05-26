import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../Common/Constants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { Spark } from "../../Common/Constants";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

export class SetupSparkClusterPane extends ContextualPaneBase {
  public setupSparkClusterText: string =
    "Looks like you have not yet created a default spark cluster for this account. To proceed and start using notebooks with spark, we'll need to create a default spark cluster for this account.";
  public readonly maxWorkerNodes: number = Spark.MaxWorkerCount;
  public workerCount: ko.Observable<number>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Enable spark");
    this.workerCount = ko.observable<number>(1);
    this.resetData();
  }

  public async submit() {
    await this.setupSparkCluster();
  }

  public async setupSparkCluster(): Promise<void> {
    if (!this.container) {
      return;
    }

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateSparkCluster, {
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: this.title()
    });
    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Creating a new default spark cluster"
    );
    try {
      this.isExecuting(true);
      await this.container.sparkClusterManager.createClusterAsync(
        this.container.databaseAccount() && this.container.databaseAccount().id,
        {
          name: "default",
          properties: {
            kind: "Spark",
            workerInstanceCount: this.workerCount(),
            driverSize: "Cosmos.Spark.D4s",
            workerSize: "Cosmos.Spark.D4s",
            creationTime: undefined,
            status: undefined
          }
        }
      );
      this.container.isAccountReady.valueHasMutated(); // refresh internal state
      this.close();
      TelemetryProcessor.traceSuccess(
        Action.CreateSparkCluster,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title()
        },
        startKey
      );
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        "Successfully created a default spark cluster for the account"
      );
    } catch (error) {
      const errorMessage = typeof error == "string" ? error : JSON.stringify(error);
      TelemetryProcessor.traceFailure(
        Action.CreateSparkCluster,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
          error: errorMessage
        },
        startKey
      );
      this.formErrors("Failed to setup a default spark cluster");
      this.formErrorsDetails(`Failed to setup a default spark cluster: ${errorMessage}`);
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to create a default spark cluster: ${errorMessage}`
      );
    } finally {
      this.isExecuting(false);
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  }
}
