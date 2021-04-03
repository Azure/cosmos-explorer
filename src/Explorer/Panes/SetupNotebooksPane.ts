import * as ko from "knockout";
import { Areas, KeyCodes } from "../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ContextualPaneBase } from "./ContextualPaneBase";

export class SetupNotebooksPane extends ContextualPaneBase {
  private description: ko.Observable<string>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);

    this.description = ko.observable<string>();
    this.resetData();
  }

  public openWithTitleAndDescription(title: string, description: string) {
    this.title(title);
    this.description(description);

    this.open();
  }

  public open() {
    super.open();
    const completeSetupBtn = document.getElementById("completeSetupBtn");
    completeSetupBtn && completeSetupBtn.focus();
  }

  public submit() {
    // override default behavior because this is not a form
  }

  public onCompleteSetupClick = async (src: any, event: MouseEvent) => {
    await this.setupNotebookWorkspace();
  };

  public onCompleteSetupKeyPress = async (src: any, event: KeyboardEvent) => {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      await this.setupNotebookWorkspace();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public async setupNotebookWorkspace(): Promise<void> {
    if (!this.container) {
      return;
    }

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateNotebookWorkspace, {
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: this.title(),
    });
    const clearInProgressMessage = logConsoleProgress("Creating a new default notebook workspace");
    try {
      this.isExecuting(true);
      await this.container.notebookWorkspaceManager.createNotebookWorkspaceAsync(
        this.container.databaseAccount() && this.container.databaseAccount().id,
        "default"
      );
      this.container.isAccountReady.valueHasMutated(); // re-trigger init notebooks
      this.close();
      TelemetryProcessor.traceSuccess(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
        },
        startKey
      );
      logConsoleInfo("Successfully created a default notebook workspace for the account");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      this.formErrors("Failed to setup a default notebook workspace");
      this.formErrorsDetails(`Failed to setup a default notebook workspace: ${errorMessage}`);
      logConsoleError(`Failed to create a default notebook workspace: ${errorMessage}`);
    } finally {
      this.isExecuting(false);
      clearInProgressMessage();
    }
  }
}
