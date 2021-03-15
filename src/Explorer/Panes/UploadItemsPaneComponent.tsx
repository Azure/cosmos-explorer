import { IconButton } from "office-ui-fabric-react/lib/Button";
import * as React from "react";
import InfoBubbleIcon from "../../../images/info-bubble.svg";
import * as Constants from "../../Common/Constants";
import { UploadDetailsRecord } from "../../workers/upload/definitions";

export interface UploadItemsPaneProps {
  selectedFilesTitle: string;
  updateSelectedFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadFileData: UploadDetailsRecord[];
}

export class UploadItemsPaneComponent extends React.Component<UploadItemsPaneProps> {
  public render(): JSX.Element {
    return (
      <div className="panelContent">
        <div className="paneMainContent">
          <div className="renewUploadItemsHeader">
            <span> Select JSON Files </span>
            <span className="infoTooltip" role="tooltip" tabIndex={0}>
              <img className="infoImg" src={InfoBubbleIcon} alt="More information" />
              <span className="tooltiptext infoTooltipWidth">
                Select one or more JSON files to upload. Each file can contain a single JSON document or an array of
                JSON documents. The combined size of all files in an individual upload operation must be less than 2 MB.
                You can perform multiple upload operations for larger data sets.
              </span>
            </span>
          </div>
          <input
            className="importFilesTitle"
            type="text"
            disabled
            value={this.props.selectedFilesTitle}
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
            onChange={this.props.updateSelectedFiles}
          />
          <IconButton
            iconProps={{ iconName: "FolderHorizontal" }}
            className="fileImportButton"
            alt="Select JSON files to upload"
            title="Select JSON files to upload"
            onClick={this.onImportButtonClick}
            onKeyPress={this.onImportButtonKeyPress}
          />
          <div className="fileUploadSummaryContainer" hidden={this.props.uploadFileData.length === 0}>
            <b>File upload status</b>
            <table className="fileUploadSummary">
              <thead>
                <tr className="fileUploadSummaryHeader fileUploadSummaryTuple">
                  <th>FILE NAME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {this.props.uploadFileData.map(
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
      </div>
    );
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
}
