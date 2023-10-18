import * as Constants from "../../Common/Constants";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Database from "../Tree/Database";

export default class FabricDatabase extends Database {
  public expandDatabase(): Promise<void> {
    this.isDatabaseExpanded(true);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "Database node",

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    return Promise.resolve();
  }
}
