import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";

export class UploadFilePane extends ContextualPaneBase implements ViewModels.UploadFilePane {
  public selectedFilesTitle: ko.Observable<string>;
  public files: ko.Observable<FileList>;
  private openOptions: ViewModels.UploadFilePaneOpenOptions;
  private submitButtonLabel: ko.Observable<string>;
  private selectFileInputLabel: ko.Observable<string>;
  private extensions: ko.Observable<string>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.resetData();
    this.selectFileInputLabel = ko.observable("");
    this.selectedFilesTitle = ko.observable<string>("");
    this.extensions = ko.observable(null);
    this.submitButtonLabel = ko.observable("Load");
    this.files = ko.observable<FileList>();
    this.files.subscribe((newFiles: FileList) => this.updateSelectedFilesTitle(newFiles));
  }

  public submit() {
    this.formErrors("");
    this.formErrorsDetails("");
    if (!this.files() || this.files().length === 0) {
      this.formErrors("No file specified");
      this.formErrorsDetails("No file specified. Please input a file.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `${this.openOptions.errorMessage} -- No file specified. Please input a file.`
      );
      return;
    }

    const file: File = this.files().item(0);
    const id: string = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `${this.openOptions.inProgressMessage}: ${file.name}`
    );
    this.isExecuting(true);
    this.openOptions
      .onSubmit(this.files().item(0))
      .then(
        () => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `${this.openOptions.successMessage} ${file.name}`
          );
          this.close();
        },
        (error: any) => {
          this.formErrors(this.openOptions.errorMessage);
          this.formErrorsDetails(`${this.openOptions.errorMessage}: ${error}`);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `${this.openOptions.errorMessage} ${file.name}: ${error}`
          );
        }
      )
      .finally(() => {
        this.isExecuting(false);
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
      });
  }

  public updateSelectedFiles(element: any, event: any): void {
    this.files(event.target.files);
  }

  public close() {
    super.close();
    this.resetData();
    this.files(undefined);
    this.resetFileInput();
  }

  public openWithOptions(options: ViewModels.UploadFilePaneOpenOptions): void {
    this.openOptions = options;
    this.title(this.openOptions.paneTitle);
    if (this.openOptions.submitButtonLabel) {
      this.submitButtonLabel(this.openOptions.submitButtonLabel);
    }
    this.selectFileInputLabel(this.openOptions.selectFileInputLabel);
    if (this.openOptions.extensions) {
      this.extensions(this.openOptions.extensions);
    }
    super.open();
  }

  public onImportLinkClick(source: any, event: MouseEvent): boolean {
    document.getElementById("importFileInput").click();
    return false;
  }

  public onImportLinkKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.onImportLinkClick(source, null);
      return false;
    }
    return true;
  };

  private updateSelectedFilesTitle(fileList: FileList) {
    this.selectedFilesTitle("");

    if (!fileList || fileList.length === 0) {
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const originalTitle = this.selectedFilesTitle();
      this.selectedFilesTitle(originalTitle + `"${fileList.item(i).name}"`);
    }
  }

  private resetFileInput(): void {
    const inputElement = $("#importFileInput");
    inputElement
      .wrap("<form>")
      .closest("form")
      .get(0)
      .reset();
    inputElement.unwrap();
  }
}
