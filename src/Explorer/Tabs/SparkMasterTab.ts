import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import Explorer from "../Explorer";

export default class SparkMasterTab extends TabsBase {
  public sparkMasterSrc: ko.Observable<string>;

  private _clusterConnectionInfo: DataModels.SparkClusterConnectionInfo;
  private _container: Explorer;

  constructor(options: ViewModels.SparkMasterTabOptions) {
    super(options);
    super.onActivate.bind(this);
    this._container = options.container;
    this._clusterConnectionInfo = options.clusterConnectionInfo;
    const sparkMasterEndpoint =
      this._clusterConnectionInfo &&
      this._clusterConnectionInfo.endpoints &&
      this._clusterConnectionInfo.endpoints.find(
        endpoint => endpoint.kind === DataModels.SparkClusterEndpointKind.SparkUI
      );
    this.sparkMasterSrc = ko.observable<string>(sparkMasterEndpoint && sparkMasterEndpoint.endpoint);
  }

  protected getContainer() {
    return this._container;
  }
}
