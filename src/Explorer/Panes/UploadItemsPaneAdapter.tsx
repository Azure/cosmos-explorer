import * as Constants from "../../Common/Constants";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import * as ko from "knockout";
import * as React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { IconButton } from "office-ui-fabric-react/lib/Button";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { UploadDetailsRecord, UploadDetails } from "../../workers/upload/definitions";
import InfoBubbleIcon from "../../../images/info-bubble.svg";
import Explorer from "../Explorer";

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

    const props: GenericRightPaneProps = {
      container: this.container,
      content: this.createContent(),
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "uploaditemspane",
      isExecuting: this.isExecuting,
      title: "Upload Items",
      submitButtonText: "Upload",
      onClose: () => this.close(),
      onSubmit: () => this.submit()
    };
    return <GenericRightPaneComponent {...props} />;
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
          error => {
            const message = ErrorParserUtility.parse(error);
            this.formError = message[0].message;
            this.formErrorDetail = message[0].message;
          }
        )
        .finally(() => {
          this.triggerRender();
          this.isExecuting = false;
        });
  }

  private createContent = (): JSX.Element => {
    return <div className="panelContent">{this.createMainContentSection()}</div>;
  };

  private createMainContentSection = (): JSX.Element => {
    return (
      <div className="paneMainContent">
        <div className="renewUploadItemsHeader">
          <span> Select JSON Files </span>
          <span className="infoTooltip" role="tooltip" tabIndex={0}>
            <img className="infoImg" src={InfoBubbleIcon} alt="More information" />
            <span className="tooltiptext infoTooltipWidth">
              Select one or more JSON files to upload. Each file can contain a single JSON document or an array of JSON
              documents. The combined size of all files in an individual upload operation must be less than 2 MB. You
              can perform multiple upload operations for larger data sets.
            </span>
          </span>
        </div>
        <input
          className="importFilesTitle"
          type="text"
          disabled
          value={this.selectedFilesTitle}
          aria-label="Select JSON Files"
        />
        <input
          type="file"
          id="importDocsInput"
          title="Upload Icon"
          multiple
          accept="application/json"
          role="button"
          tabIndex={0}
          style={{ display: "none" }}
          onChange={this.updateSelectedFiles}
        />
        <IconButton
          iconProps={{ iconName: "FolderHorizontal" }}
          className="fileImportButton"
          alt="Select JSON files to upload"
          title="Select JSON files to upload"
          onClick={this.onImportButtonClick}
          onKeyPress={this.onImportButtonKeyPress}
        />
        <div className="fileUploadSummaryContainer" hidden={this.uploadFileData.length === 0}>
          <b>File upload status</b>
          <table className="fileUploadSummary">
            <thead>
              <tr className="fileUploadSummaryHeader fileUploadSummaryTuple">
                <th>FILE NAME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {this.uploadFileData.map(
                (data: UploadDetailsRecord): JSX.Element => {
                  return (
                    <tr className="fileUploadSummaryTuple" key={data.fileName}>
                      <td>{data.fileName}</td>
                      <td>{this.fileUploadSummaryText(data.numSucceeded, data.numFailed)}</td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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

  private fileUploadSummaryText = (numSucceeded: number, numFailed: number): string => {
    return `${numSucceeded} items created, ${numFailed} errors`;
  };

  private onImportButtonClick = (): void => {
    document.getElementById("importDocsInput").click();
  };

  private onImportButtonKeyPress = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.charCode === Constants.KeyCodes.Enter || event.charCode === Constants.KeyCodes.Space) {
      this.onImportButtonClick();
      event.stopPropagation();
    }
  };

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
