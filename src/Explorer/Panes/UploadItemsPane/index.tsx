import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import { UploadDetails, UploadDetailsRecord } from "../../../workers/upload/definitions";
import { getErrorMessage } from "../../Tables/Utilities";

export interface UploadItemsPaneProps {
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export const UploadItemsPane: FunctionComponent<UploadItemsPaneProps> = ({
  closePanel,
  openNotificationConsole,
}: UploadItemsPaneProps) => {


    const [selectedFilesTitle, setSelectedFilesTitle] = useState<string>("")
    const [files, setFiles] = useState<FileList>();
    const [uploadFileDataVisible, setUploadFileDataVisible] = useState<boolean>(false)
  const [uploadFileData, setUploadFileData] = useState<UploadDetailsRecord[]>([])
  const [formErrors, setFormErrors] = useState<string>("")
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState<boolean>()
const [title, setTitle] = useState<string>("")

  useEffect(() => {
    setUploadFileDataVisible( !!uploadFileData && uploadFileData.length > 0
      );
  }, [uploadFileData])

  useEffect(() => {
    _initTitle();
    resetData();
    
    files.subscribe((newFiles: FileList) => _updateSelectedFilesTitle(newFiles));
    
  }, [])
    
  const submit = () => {
    setFormErrors("");
    if (!files || files.length === 0) {
        setFormErrors("No files specified");
        setFormErrorsDetails("No files were specified. Please input at least one file.");
        logConsoleError(
        "Could not upload items -- No files were specified. Please input at least one file."
      );
      return;
    } else if (_totalFileSizeForFileList(files) > UPLOAD_FILE_SIZE_LIMIT) {
        setFormErrors("Upload file size limit exceeded");
        setFormErrorsDetails("Total file upload size exceeds the 2 MB file size limit.");
        logConsoleError(
        "Could not upload items -- Total file upload size exceeds the 2 MB file size limit."
      );
      return;
    }

    const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
    setIsExecuting(true);
    selectedCollection &&
      selectedCollection
        .uploadFiles(files)
        .then(
          (uploadDetails: UploadDetails) => {
            setUploadFileData(uploadDetails.data);
            setFiles(undefined);
            _resetFileInput();
          },
          (error: any) => {
            const errorMessage = getErrorMessage(error);
            setFormErrors(errorMessage);
            setFormErrorsDetails(errorMessage);
          }
        )
        .finally(() => {
            setIsExecuting(false);
        });
  }

  const updateSelectedFiles = ( event: any): void =>  {
    setFiles(event.target.files);
  }

  const close = () => {
    resetData();
    setFiles(undefined);
    setUploadFileData([]);
    _resetFileInput();
  }

  const onImportLinkClick = (event: MouseEvent): boolean => {
    document.getElementById("importDocsInput").click();
    return false;
  }

  const onImportLinkKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      onImportLinkClick(source);
      return false;
    }
    return true;
  };

  const fileUploadSummaryText = (numSucceeded: number, numFailed: number): string => {
    return `${numSucceeded} items created, ${numFailed} errors`;
  };

  const _totalFileSizeForFileList = (fileList: FileList): number => {
    let totalFileSize: number = 0;
    if (!fileList) {
      return totalFileSize;
    }
    for (let i = 0; i < fileList.length; i++) {
      totalFileSize = totalFileSize + fileList.item(i).size;
    }

    return totalFileSize;
  }

  const _updateSelectedFilesTitle = (fileList: FileList) => {
    setSelectedFilesTitle("");

    if (!fileList || fileList.length === 0) {
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const originalTitle = selectedFilesTitle;
      setSelectedFilesTitle(originalTitle + `"${fileList.item(i).name}"`);
    }
  }

  const _initTitle(): void {
    if (container.isPreferredApiCassandra() || container.isPreferredApiTable()) {
      setTitle("Upload Tables");
    } else if (container.isPreferredApiGraph()) {
        setTitle("Upload Graph");
    } else {
        setTitle("Upload Items");
    }
  }

  const _resetFileInput(): void {
    const inputElement = $("#importDocsInput");
    inputElement.wrap("<form>").closest("form").get(0).reset();
    inputElement.unwrap();
  }
  return (
    <div data-bind="visible: visible, event: { keydown: onPaneKeyDown }">
      <div
        className="contextual-pane-out"
        data-bind="
                click: cancel,
                clickBubble: false"
      ></div>
      <div className="contextual-pane" id="uploaditemspane">
        <div className="contextual-pane-in">
          <form className="paneContentContainer" data-bind="submit: submit">
            <div className="firstdivbg headerline">
              <span role="heading" aria-level="2" data-bind="text: title"></span>
              <div
                className="closeImg"
                role="button"
                aria-label="Close pane"
                tabindex="0"
                data-bind="
                                click: cancel, event: { keydown: onCloseKeyPress }"
              >
                <img src="../../../images/close-black.svg" title="Close" alt="Close" />
              </div>
            </div>
            <div
              className="warningErrorContainer"
              aria-live="assertive"
              data-bind="visible: formErrors() && formErrors() !== ''"
            >
              <div className="warningErrorContent">
                <span>
                  <img className="paneErrorIcon" src="/error_red.svg" alt="Error" />
                </span>
                <span className="warningErrorDetailsLinkContainer">
                  <span className="formErrors" data-bind="text: formErrors, attr: { title: formErrors }"></span>
                  <a
                    className="errorLink"
                    role="link"
                    data-bind="
                            visible: formErrorsDetails() && formErrorsDetails() !== '',
                            click: showErrorDetails"
                  >
                    More details
                  </a>
                </span>
              </div>
            </div>
            <div className="paneMainContent">
              <div>
                <div className="renewUploadItemsHeader">
                  <span> Select JSON Files </span>
                  <span className="infoTooltip" role="tooltip" tabindex="0">
                    <img className="infoImg" src="/info-bubble.svg" alt="More information" />
                    <span className="tooltiptext infoTooltipWidth">
                      Select one or more JSON files to upload. Each file can contain a single JSON document or an array
                      of JSON documents. The combined size of all files in an individual upload operation must be less
                      than 2 MB. You can perform multiple upload operations for larger data sets.
                    </span>
                  </span>
                </div>
                <input
                  className="importFilesTitle"
                  type="text"
                  disabled
                  data-bind="value: selectedFilesTitle"
                  aria-label="Select JSON Files"
                />
                <input
                  type="file"
                  id="importDocsInput"
                  title="Upload Icon"
                  multiple
                  accept="application/json"
                  role="button"
                  tabindex="0"
                  style="display: none"
                  data-bind="event: { change: updateSelectedFiles }"
                />
                <a
                  href="#"
                  id="fileImportLink"
                  data-bind="event: { click: onImportLinkClick, keypress: onImportLinkKeyPress }"
                  autoFocus
                >
                  <img
                    className="fileImportImg"
                    src="/folder_16x16.svg"
                    alt="Select JSON files to upload"
                    title="Select JSON files to upload"
                  />
                </a>
              </div>
              <div className="fileUploadSummaryContainer" data-bind="visible: uploadFileDataVisible">
                <b>File upload status</b>
                <table className="fileUploadSummary">
                  <thead>
                    <tr className="fileUploadSummaryHeader fileUploadSummaryTuple">
                      <th>FILE NAME</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="fileUploadSummaryTuple">
                      <td data-bind="text: $data.fileName"></td>
                      <td data-bind="text: $parent.fileUploadSummaryText($data.numSucceeded, $data.numFailed)"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="paneFooter">
              <div className="leftpanel-okbut">
                <input type="submit" value="Upload" className="btncreatecoll1" />
              </div>
            </div>
          </form>
        </div>
        <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" data-bind="visible: isExecuting">
          <img className="dataExplorerLoader" src="/LoadingIndicator_3Squares.gif" />
        </div>
      </div>
    </div>
  );
};
