import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";

import { NotebookClientV2 } from "../Notebook/NotebookClientV2";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Explorer from "../Explorer";
import { ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas } from "../../Common/Constants";

export interface NotebookTabBaseOptions extends ViewModels.TabOptions {
  container: Explorer;
}

/**
 * Every notebook-based tab inherits from this class. It holds the static reference to a notebook client (singleton)
 */
export default class NotebookTabBase extends TabsBase {
  protected static clientManager: NotebookClientV2;
  protected container: Explorer;

  constructor(options: NotebookTabBaseOptions) {
    super(options);

    this.container = options.container;

    if (!NotebookTabBase.clientManager) {
      NotebookTabBase.clientManager = new NotebookClientV2({
        connectionInfo: this.container.notebookServerInfo(),
        databaseAccountName: this.container.databaseAccount().name,
        defaultExperience: this.container.defaultExperience(),
        contentProvider: this.container.notebookManager?.notebookContentProvider,
      });
    }
  }

  /**
   * Override base behavior
   */
  protected getContainer(): Explorer {
    return this.container;
  }

  protected traceTelemetry(actionType: number): void {
    TelemetryProcessor.trace(actionType, ActionModifiers.Mark, {
      databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience && this.container.defaultExperience(),
      dataExplorerArea: Areas.Notebook,
    });
  }
}
