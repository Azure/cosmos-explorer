import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { Areas, KeyCodes } from "../../Common/Constants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as ko from "knockout";

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
      databaseAccountName: this.container && this.container.databaseAccount().name,
      defaultExperience: this.container && this.container.defaultExperience(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: this.title()
    });
    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Creating a new default notebook workspace"
    );
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
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title()
        },
        startKey
      );
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        "Successfully created a default notebook workspace for the account"
      );
    } catch (error) {
      const errorMessage = typeof error == "string" ? error : JSON.stringify(error);
      TelemetryProcessor.traceFailure(
        Action.CreateNotebookWorkspace,
        {
          databaseAccountName: this.container && this.container.databaseAccount().name,
          defaultExperience: this.container && this.container.defaultExperience(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: this.title(),
          error: errorMessage
        },
        startKey
      );
      this.formErrors("Failed to setup a default notebook workspace");
      this.formErrorsDetails(`Failed to setup a default notebook workspace: ${errorMessage}`);
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to create a default notebook workspace: ${errorMessage}`
      );
    } finally {
      this.isExecuting(false);
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  }
}
