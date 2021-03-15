import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import * as ViewModels from "../../Contracts/ViewModels";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { UploadDetails, UploadDetailsRecord } from "../../workers/upload/definitions";
import Explorer from "../Explorer";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import { UploadItemsPaneComponent, UploadItemsPaneProps } from "./UploadItemsPaneComponent";

const UPLOAD_FILE_SIZE_LIMIT = 2097152;

export class UploadItemsPaneAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;
  private isOpened: boolean;
  private isExecuting: boolean;
  private formError: string;
  private formErrorDetail: string;
  private selectedFiles: FileList;
  private selectedFilesTitle: string;
  private uploadFileData: UploadDetailsRecord[];

  public constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());
    this.reset();
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    if (!this.isOpened) {
      return undefined;
    }

    const genericPaneProps: GenericRightPaneProps = {
      container: this.container,
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "uploaditemspane",
      isExecuting: this.isExecuting,
      title: "Upload Items",
      submitButtonText: "Upload",
      onClose: () => this.close(),
      onSubmit: () => this.submit(),
    };

    const uploadItemsPaneProps: UploadItemsPaneProps = {
      selectedFilesTitle: this.selectedFilesTitle,
      updateSelectedFiles: this.updateSelectedFiles,
      uploadFileData: this.uploadFileData,
    };

    return (
      <GenericRightPaneComponent {...genericPaneProps}>
        <UploadItemsPaneComponent {...uploadItemsPaneProps} />
      </GenericRightPaneComponent>
    );
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public open(): void {
    this.isOpened = true;
    this.triggerRender();
  }

  public close(): void {
    this.reset();
    this.triggerRender();
  }

  public submit(): void {
    this.formError = "";
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.formError = "No files specified";
      this.formErrorDetail = "No files were specified. Please input at least one file.";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not upload items -- No files were specified. Please input at least one file."
      );
      this.triggerRender();
      return;
    } else if (this._totalFileSizeForFileList() > UPLOAD_FILE_SIZE_LIMIT) {
      this.formError = "Upload file size limit exceeded";
      this.formErrorDetail = "Total file upload size exceeds the 2 MB file size limit.";
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        "Could not upload items -- Total file upload size exceeds the 2 MB file size limit."
      );
      this.triggerRender();
      return;
    }

    const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
    this.isExecuting = true;
    this.triggerRender();
    selectedCollection &&
      selectedCollection
        .uploadFiles(this.selectedFiles)
        .then(
          (uploadDetails: UploadDetails) => {
            this.uploadFileData = uploadDetails.data;
            this.selectedFiles = undefined;
            this.selectedFilesTitle = "";
          },
          (error) => {
            const errorMessage = getErrorMessage(error);
            this.formError = errorMessage;
            this.formErrorDetail = errorMessage;
          }
        )
        .finally(() => {
          this.triggerRender();
          this.isExecuting = false;
        });
  }

  private updateSelectedFiles = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.selectedFiles = event.target.files;
    this._updateSelectedFilesTitle();
    this.triggerRender();
  };

  private _updateSelectedFilesTitle = (): void => {
    this.selectedFilesTitle = "";

    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return;
    }

    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.selectedFilesTitle += `"${this.selectedFiles.item(i).name}"`;
    }
  };

  private _totalFileSizeForFileList(): number {
    let totalFileSize = 0;
    if (!this.selectedFiles) {
      return totalFileSize;
    }

    for (let i = 0; i < this.selectedFiles.length; i++) {
      totalFileSize += this.selectedFiles.item(i).size;
    }

    return totalFileSize;
  }

  private reset = (): void => {
    this.isOpened = false;
    this.isExecuting = false;
    this.formError = "";
    this.formErrorDetail = "";
    this.selectedFiles = undefined;
    this.selectedFilesTitle = "";
    this.uploadFileData = [];
  };
}
