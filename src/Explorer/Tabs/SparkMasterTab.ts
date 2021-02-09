import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import Explorer from "../Explorer";

interface SparkMasterTabOptions extends ViewModels.TabOptions {
  clusterConnectionInfo: DataModels.SparkClusterConnectionInfo;
  container: Explorer;
}

export default class SparkMasterTab extends TabsBase {
  public sparkMasterSrc: ko.Observable<string>;

  private _clusterConnectionInfo: DataModels.SparkClusterConnectionInfo;
  private _container: Explorer;

  constructor(options: SparkMasterTabOptions) {
    super(options);
    super.onActivate.bind(this);
    this._container = options.container;
    this._clusterConnectionInfo = options.clusterConnectionInfo;
    const sparkMasterEndpoint =
      this._clusterConnectionInfo &&
      this._clusterConnectionInfo.endpoints &&
      this._clusterConnectionInfo.endpoints.find(
        (endpoint) => endpoint.kind === DataModels.SparkClusterEndpointKind.SparkUI
      );
    this.sparkMasterSrc = ko.observable<string>(sparkMasterEndpoint && sparkMasterEndpoint.endpoint);
  }

  public getContainer() {
    return this._container;
  }
}
