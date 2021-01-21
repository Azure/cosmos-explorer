import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { UploadDetailsRecord, UploadDetails } from "../../workers/upload/definitions";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";

const UPLOAD_FILE_SIZE_LIMIT = 2097152;

export class UploadItemsPane extends ContextualPaneBase {
  public selectedFilesTitle: ko.Observable<string>;
  public files: ko.Observable<FileList>;
  public uploadFileDataVisible: ko.Computed<boolean>;
  public uploadFileData: ko.ObservableArray<UploadDetailsRecord>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this._initTitle();
    this.resetData();

    this.selectedFilesTitle = ko.observable<string>("");
    this.uploadFileData = ko.observableArray<UploadDetailsRecord>();
    this.uploadFileDataVisible = ko.computed<boolean>(
      () => !!this.uploadFileData() && this.uploadFileData().length > 0
    );
    this.files = ko.observable<FileList>();
    this.files.subscribe((newFiles: FileList) => this._updateSelectedFilesTitle(newFiles));
  }

  public submit() {
    this.formErrors("");
    if (!this.files() || this.files().length === 0) {
      this.formErrors("No files specified");
      this.formErrorsDetails("No files were specified. Please input at least one file.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not upload items -- No files were specified. Please input at least one file."
      );
      return;
    } else if (this._totalFileSizeForFileList(this.files()) > UPLOAD_FILE_SIZE_LIMIT) {
      this.formErrors("Upload file size limit exceeded");
      this.formErrorsDetails("Total file upload size exceeds the 2 MB file size limit.");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not upload items -- Total file upload size exceeds the 2 MB file size limit."
      );
      return;
    }

    const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
    this.isExecuting(true);
    selectedCollection &&
      selectedCollection
        .uploadFiles(this.files())
        .then(
          (uploadDetails: UploadDetails) => {
            this.uploadFileData(uploadDetails.data);
            this.files(undefined);
            this._resetFileInput();
          },
          (error: any) => {
            const errorMessage = getErrorMessage(error);
            this.formErrors(errorMessage);
            this.formErrorsDetails(errorMessage);
          }
        )
        .finally(() => {
          this.isExecuting(false);
        });
  }

  public updateSelectedFiles(element: any, event: any): void {
    this.files(event.target.files);
  }

  public close() {
    super.close();
    this.resetData();
    this.files(undefined);
    this.uploadFileData([]);
    this._resetFileInput();
  }

  public onImportLinkClick(source: any, event: MouseEvent): boolean {
    document.getElementById("importDocsInput").click();
    return false;
  }

  public onImportLinkKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.onImportLinkClick(source, null);
      return false;
    }
    return true;
  };

  public fileUploadSummaryText = (numSucceeded: number, numFailed: number): string => {
    return `${numSucceeded} items created, ${numFailed} errors`;
  };

  private _totalFileSizeForFileList(fileList: FileList): number {
    let totalFileSize: number = 0;
    if (!fileList) {
      return totalFileSize;
    }
    for (let i = 0; i < fileList.length; i++) {
      totalFileSize = totalFileSize + fileList.item(i).size;
    }

    return totalFileSize;
  }

  private _updateSelectedFilesTitle(fileList: FileList) {
    this.selectedFilesTitle("");

    if (!fileList || fileList.length === 0) {
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const originalTitle = this.selectedFilesTitle();
      this.selectedFilesTitle(originalTitle + `"${fileList.item(i).name}"`);
    }
  }

  private _initTitle(): void {
    if (this.container.isPreferredApiCassandra() || this.container.isPreferredApiTable()) {
      this.title("Upload Tables");
    } else if (this.container.isPreferredApiGraph()) {
      this.title("Upload Graph");
    } else {
      this.title("Upload Items");
    }
  }

  private _resetFileInput(): void {
    const inputElement = $("#importDocsInput");
    inputElement
      .wrap("<form>")
      .closest("form")
      .get(0)
      .reset();
    inputElement.unwrap();
  }
}
