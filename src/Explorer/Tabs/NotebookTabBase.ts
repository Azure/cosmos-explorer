import { Areas } from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import Explorer from "../Explorer";
import { NotebookClientV2 } from "../Notebook/NotebookClientV2";
import { useNotebook } from "../Notebook/useNotebook";
import TabsBase from "./TabsBase";

export interface NotebookTabBaseOptions extends ViewModels.TabOptions {
  account: DataModels.DatabaseAccount;
  masterKey: string;
  container: Explorer;
}

/**
 * Every notebook-based tab inherits from this class. It holds the static reference to a notebook client (singleton)
 * Re-initiating the constructor when ever a new container got allocated.
 */
export default class NotebookTabBase extends TabsBase {
  protected static clientManager: NotebookClientV2;
  protected container: Explorer;

  constructor(options: NotebookTabBaseOptions) {
    super(options);

    this.container = options.container;

    useNotebook.subscribe(
      () => {
        const notebookServerInfo = useNotebook.getState().notebookServerInfo;
        if (notebookServerInfo && notebookServerInfo.notebookServerEndpoint) {
          NotebookTabBase.clientManager = undefined;
        }
      },
      (state) => state.notebookServerInfo,
    );
    if (!NotebookTabBase.clientManager) {
      NotebookTabBase.clientManager = new NotebookClientV2({
        connectionInfo: useNotebook.getState().notebookServerInfo,
        databaseAccountName: userContext?.databaseAccount?.name,
        defaultExperience: userContext.apiType,
        contentProvider: this.container.notebookManager?.notebookContentProvider,
      });
    }
  }

  /**
   * Override base behavior
   */
  public getContainer(): Explorer {
    return this.container;
  }

  protected traceTelemetry(actionType: number): void {
    TelemetryProcessor.trace(actionType, ActionModifiers.Mark, {
      dataExplorerArea: Areas.Notebook,
    });
  }
}
