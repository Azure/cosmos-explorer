import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { ConnectionStringParser } from "../../Platform/Hosted/Helpers/ConnectionStringParser";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";

export class RenewAdHocAccessPane extends ContextualPaneBase {
  public accessKey: ko.Observable<string>;
  public isHelperImageVisible: ko.Observable<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Connect to Azure Cosmos DB");
    this.accessKey = ko.observable<string>();
    this.isHelperImageVisible = ko.observable<boolean>(false);
  }

  public submit(): void {
    this.formErrors("");
    this.formErrorsDetails("");

    if (this._shouldShowContextSwitchPrompt()) {
      this.container.displayContextSwitchPromptForConnectionString(this.accessKey());
    } else if (!!this.formErrors()) {
      return;
    } else {
      this.isExecuting(true);
      this._renewShareAccess();
    }
  }

  public onShowHelperImageClick = (src: any, event: MouseEvent): void => {
    this.isHelperImageVisible(!this.isHelperImageVisible());
  };

  public onShowHelperImageKeyPress = (src: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.onShowHelperImageClick(src, null);
      return false;
    }

    return true;
  };

  private _shouldShowContextSwitchPrompt(): boolean {
    const inputMetadata: DataModels.AccessInputMetadata = ConnectionStringParser.parseConnectionString(
      this.accessKey()
    );
    const apiKind: DataModels.ApiKind =
      this.container && DefaultExperienceUtility.getApiKindFromDefaultExperience(this.container.defaultExperience());
    const hasOpenedTabs: boolean =
      (this.container && this.container.tabsManager && this.container.tabsManager.openedTabs().length > 0) || false;

    if (!inputMetadata || inputMetadata.apiKind == null || !inputMetadata.accountName) {
      this.formErrors("Invalid connection string input");
      this.formErrorsDetails("Please enter a valid connection string");
    }

    if (
      !inputMetadata ||
      this.formErrors() ||
      !this.container ||
      apiKind == null ||
      !this.container.databaseAccount ||
      !this.container.defaultExperience ||
      !hasOpenedTabs ||
      (this.container.databaseAccount().name === inputMetadata.accountName &&
        apiKind === inputMetadata.apiKind &&
        !hasOpenedTabs)
    ) {
      return false;
    }

    return true;
  }

  private _renewShareAccess = (): void => {
    this.container
      .renewShareAccess(this.accessKey())
      .fail((error: any) => {
        const errorMessage: string = getErrorMessage(error);
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, `Failed to connect: ${errorMessage}`);
        this.formErrors(errorMessage);
        this.formErrorsDetails(errorMessage);
      })
      .finally(() => {
        this.isExecuting(false);
      });
  };

  public close(): void {
    super.close();
    this.isHelperImageVisible(false);
    this.formErrors("");
    this.formErrorsDetails("");
    this.accessKey("");
  }
}
