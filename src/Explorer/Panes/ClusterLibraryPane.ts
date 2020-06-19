import _ from "underscore";
import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ClusterLibraryGridAdapter } from "../Controls/LibraryManagement/ClusterLibraryGridAdapter";
import { ClusterLibraryGridProps, ClusterLibraryItem } from "../Controls/LibraryManagement/ClusterLibraryGrid";
import { Library, SparkCluster, SparkClusterLibrary } from "../../Contracts/DataModels";
import * as Logger from "../../Common/Logger";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";

export class ClusterLibraryPane extends ContextualPaneBase {
  public clusterLibraryGridAdapter: ClusterLibraryGridAdapter;

  private _clusterLibraryProps: ko.Observable<ClusterLibraryGridProps>;
  private _originalCluster: SparkCluster;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Cluster Libraries");

    this._clusterLibraryProps = ko.observable<ClusterLibraryGridProps>({
      libraryItems: [],
      onInstalledChanged: this._onInstalledChanged
    });
    this.clusterLibraryGridAdapter = new ClusterLibraryGridAdapter();
    this.clusterLibraryGridAdapter.parameters = this._clusterLibraryProps;

    this.resetData();
  }

  public open(): void {
    const resourceId: string = this.container.databaseAccount() && this.container.databaseAccount().id;
    Promise.all([this._getLibraries(resourceId), this._getDefaultCluster(resourceId)]).then(
      result => {
        const [libraries, cluster] = result;
        this._originalCluster = cluster;
        const libraryItems = this._mapClusterLibraries(cluster, libraries);
        this._updateClusterLibraryGridStates({ libraryItems });
      },
      reason => {
        const parsedError = ErrorParserUtility.parse(reason);
        this.formErrors(parsedError[0].message);
      }
    );
    super.open();
  }

  public submit(): void {
    const resourceId: string = this.container.databaseAccount() && this.container.databaseAccount().id;
    this.isExecuting(true);
    if (this._areLibrariesChanged()) {
      const newLibraries = this._clusterLibraryProps()
        .libraryItems.filter(lib => lib.installed)
        .map(lib => ({ name: lib.name }));
      this._updateClusterLibraries(resourceId, this._originalCluster, newLibraries).then(
        () => {
          this.isExecuting(false);
          this.close();
        },
        reason => {
          this.isExecuting(false);
          const parsedError = ErrorParserUtility.parse(reason);
          this.formErrors(parsedError[0].message);
        }
      );
    } else {
      this.isExecuting(false);
      this.close();
    }
  }

  private _updateClusterLibraryGridStates(states: Partial<ClusterLibraryGridProps>): void {
    const merged = { ...this._clusterLibraryProps(), ...states };
    this._clusterLibraryProps(merged);
    this._clusterLibraryProps.valueHasMutated();
  }

  private _onInstalledChanged = (libraryName: string, installed: boolean): void => {
    const items = this._clusterLibraryProps().libraryItems;
    const library = _.find(items, item => item.name === libraryName);
    library.installed = installed;
    this._clusterLibraryProps.valueHasMutated();
  };

  private _areLibrariesChanged(): boolean {
    const original = this._originalCluster.properties && this._originalCluster.properties.libraries;
    const changed = this._clusterLibraryProps()
      .libraryItems.filter(lib => lib.installed)
      .map(lib => lib.name);
    if (original.length !== changed.length) {
      return true;
    }
    const newLibraries = new Set(changed);
    for (let o of original) {
      if (!newLibraries.has(o.name)) {
        return false;
      }
      newLibraries.delete(o.name);
    }
    return newLibraries.size === 0;
  }

  private _mapClusterLibraries(cluster: SparkCluster, libraries: Library[]): ClusterLibraryItem[] {
    const clusterLibraries = cluster && cluster.properties && cluster.properties.libraries;
    const libraryItems = libraries.map(lib => ({
      ...lib,
      installed: clusterLibraries.some(clusterLib => clusterLib.name === lib.name)
    }));
    return libraryItems;
  }

  private async _getLibraries(resourceId: string): Promise<Library[]> {
    if (!resourceId) {
      return Promise.reject("invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("cluster client is not initialized yet");
    }

    const inProgressId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Fetching libraries...`
    );
    try {
      return await this.container.sparkClusterManager.getLibrariesAsync(resourceId);
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to fetch libraries. Reason: ${JSON.stringify(e)}`
      );
      Logger.logError(e, "Explorer/_getLibraries");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressId);
    }
  }

  private async _getDefaultCluster(resourceId: string, clusterId: string = "default"): Promise<SparkCluster> {
    if (!resourceId) {
      return Promise.reject("invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("cluster client is not initialized yet");
    }

    const inProgressId = NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.InProgress, `Fetching cluster...`);
    try {
      const cluster = await this.container.sparkClusterManager.getClusterAsync(resourceId, clusterId);
      return cluster;
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to fetch cluster. Reason: ${JSON.stringify(e)}`
      );
      Logger.logError(e, "Explorer/_getCluster");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressId);
    }
  }

  private async _updateClusterLibraries(
    resourceId: string,
    originalCluster: SparkCluster,
    newLibrarys: SparkClusterLibrary[]
  ): Promise<void> {
    if (!originalCluster || !resourceId) {
      return Promise.reject("Invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("Cluster client is not initialized yet");
    }

    TelemetryProcessor.traceStart(Action.ClusterLibraryManage, {
      resourceId,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title(),
      area: "ClusterLibraryPane/_updateClusterLibraries",
      originalCluster,
      newLibrarys
    });

    let newCluster = originalCluster;
    newCluster.properties.libraries = newLibrarys;

    const consoleId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Updating ${newCluster.name} libraries...`
    );

    try {
      const cluster = await this.container.sparkClusterManager.updateClusterAsync(
        resourceId,
        originalCluster.name,
        newCluster
      );
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        `Successfully updated ${newCluster.name} libraries.`
      );
      TelemetryProcessor.traceSuccess(Action.ClusterLibraryManage, {
        resourceId,
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.ContextualPane,
        paneTitle: this.title(),
        area: "ClusterLibraryPane/_updateClusterLibraries",
        cluster
      });
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to upload ${newCluster.name} libraries. Reason: ${JSON.stringify(e)}`
      );
      TelemetryProcessor.traceFailure(Action.ClusterLibraryManage, {
        databaseAccountName: this.container.databaseAccount().name,
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.ContextualPane,
        paneTitle: this.title(),
        area: "ClusterLibraryPane/_updateClusterLibraries",
        error: e
      });
      Logger.logError(e, "Explorer/_updateClusterLibraries");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(consoleId);
    }
  }
}
