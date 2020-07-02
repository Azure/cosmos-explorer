import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../Common/Constants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ClusterSettingsComponentAdapter } from "../Controls/Spark/ClusterSettingsComponentAdapter";
import { ClusterSettingsComponentProps } from "../Controls/Spark/ClusterSettingsComponent";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { Spark } from "../../Common/Constants";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

const MAX_NUM_WORKERS = 10;

export class ManageSparkClusterPane extends ContextualPaneBase {
  public readonly maxWorkerCount = Spark.MaxWorkerCount;
  public workerCount: ko.Observable<number>;
  public clusterSettingsComponentAdapter: ClusterSettingsComponentAdapter;

  private _settingsComponentAdapterProps: ko.Observable<ClusterSettingsComponentProps>;
  private _defaultCluster: ko.Observable<DataModels.SparkCluster>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Manage spark cluster");
    this.workerCount = ko.observable<number>();
    this._defaultCluster = ko.observable<DataModels.SparkCluster>({
      id: undefined,
      name: undefined,
      type: undefined,
      properties: {
        kind: undefined,
        creationTime: undefined,
        driverSize: undefined,
        status: undefined,
        workerInstanceCount: undefined,
        workerSize: undefined,
      },
    });
    this._settingsComponentAdapterProps = ko.observable<ClusterSettingsComponentProps>({
      cluster: this._defaultCluster(),
      onClusterSettingsChanged: this.onClusterSettingsChange,
    });
    this._defaultCluster.subscribe((cluster) => {
      this._settingsComponentAdapterProps().cluster = cluster;
      this._settingsComponentAdapterProps.valueHasMutated(); // trigger component re-render
    });
    this.clusterSettingsComponentAdapter = new ClusterSettingsComponentAdapter();
    this.clusterSettingsComponentAdapter.parameters = this._settingsComponentAdapterProps;
    this.resetData();
  }

  public async submit() {
    if (!this.workerCount() || this.workerCount() > MAX_NUM_WORKERS) {
      this.formErrors("Invalid worker count specified");
      this.formErrorsDetails(`The number of workers should be between 0 and ${MAX_NUM_WORKERS}`);
      return;
    }

    if (!this._defaultCluster()) {
      this.formErrors("No default cluster found");
      this.formErrorsDetails("No default cluster found to be associated with this account");
      return;
    }

    const startKey = TelemetryProcessor.traceStart(Action.UpdateSparkCluster, {
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: this.title(),
    });
    const workerCount = this.workerCount();
    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Updating default cluster worker count to ${workerCount} nodes`
    );
    this.isExecuting(true);
    try {
      const databaseAccount = this.container && this.container.databaseAccount();
      const cluster = this._defaultCluster();
      cluster.properties.workerInstanceCount = workerCount;
      const updatedCluster =
        this.container &&
        (await this.container.sparkClusterManager.updateClusterAsync(
          databaseAccount && databaseAccount.id,
          cluster.name,
          cluster
        ));
      this._defaultCluster(updatedCluster);
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        `Successfully updated default cluster worker count to ${workerCount} nodes`
      );
      TelemetryProcessor.traceSuccess(
        Action.UpdateSparkCluster,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
        },
        startKey
      );
    } catch (error) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to update default cluster worker count to ${workerCount} nodes: ${JSON.stringify(error)}`
      );
      TelemetryProcessor.traceFailure(
        Action.UpdateSparkCluster,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
          error: JSON.stringify(error),
        },
        startKey
      );
    } finally {
      this.isExecuting(false);
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  }

  public onClusterSettingsChange = (cluster: DataModels.SparkCluster) => {
    this._defaultCluster(cluster);
    this.workerCount(
      (cluster &&
        cluster.properties &&
        cluster.properties.workerInstanceCount !== undefined &&
        cluster.properties.workerInstanceCount) ||
        0
    );
  };

  public async open() {
    const defaultCluster = await this.container.sparkClusterManager.getClusterAsync(
      this.container.databaseAccount().id,
      "default"
    );
    this._defaultCluster(defaultCluster);
    this.workerCount(
      (defaultCluster &&
        defaultCluster.properties &&
        defaultCluster.properties.workerInstanceCount !== undefined &&
        defaultCluster.properties.workerInstanceCount) ||
        0
    );
    super.open();
  }
}
