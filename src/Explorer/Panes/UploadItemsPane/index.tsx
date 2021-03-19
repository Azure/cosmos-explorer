import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "office-ui-fabric-react";
import React, { ChangeEvent, FunctionComponent, KeyboardEvent, useEffect, useRef, useState } from "react";
import FolderIcon from "../../../../images/folder_16x16.svg";
import * as Constants from "../../../Common/Constants";
import { userContext } from "../../../UserContext";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import { UploadDetails, UploadDetailsRecord } from "../../../workers/upload/definitions";
import Explorer from "../../Explorer";
import { getErrorMessage } from "../../Tables/Utilities";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { Tooltip } from "./Tooltip";

const UPLOAD_FILE_SIZE_LIMIT = 2097152;

export interface UploadItemsPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

interface IUploadFileData {
  numSucceeded: number;
  numFailed: number;
  fileName: string;
}

const getTitle = (): string => {
  if (userContext.apiType === "Cassandra" || userContext.apiType === "Tables") {
    return "Upload Tables";
  } else if (userContext.apiType === "Gremlin") {
    return "Upload Graph";
  } else {
    return "Upload Items";
  }
};

export const UploadItemsPane: FunctionComponent<UploadItemsPaneProps> = ({
  explorer,
  closePanel,
}: UploadItemsPaneProps) => {
  const [selectedFilesTitle, setSelectedFilesTitle] = useState<string>("");
  const [files, setFiles] = useState<FileList>();
  const [uploadFileDataVisible, setUploadFileDataVisible] = useState<boolean>(false);
  const [uploadFileData, setUploadFileData] = useState<UploadDetailsRecord[]>([]);
  const [formError, setFormError] = useState<string>("");
  const [formErrorDetail, setFormErrorDetail] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>();

  const fileRef = useRef<HTMLInputElement>();
  useEffect(() => {
    setUploadFileDataVisible(uploadFileData?.length > 0);
  }, [uploadFileData]);

  const onSubmit = () => {
    setFormError("");
    if (!files || files.length === 0) {
      setFormError("No files specified");
      setFormErrorDetail("No files were specified. Please input at least one file.");
      logConsoleError("Could not upload items -- No files were specified. Please input at least one file.");
    } else if (_totalFileSizeForFileList(files) > UPLOAD_FILE_SIZE_LIMIT) {
      setFormError("Upload file size limit exceeded");
      setFormErrorDetail("Total file upload size exceeds the 2 MB file size limit.");
      logConsoleError("Could not upload items -- Total file upload size exceeds the 2 MB file size limit.");
    }

    const selectedCollection = explorer.findSelectedCollection();

    setIsExecuting(true);

    selectedCollection
      ?.uploadFiles(files)
      .then(
        (uploadDetails: UploadDetails) => {
          setUploadFileData(uploadDetails.data);
          setSelectedFilesTitle("");
          setFiles(undefined);
        },
        (error: Error) => {
          const errorMessage = getErrorMessage(error);
          setFormError(errorMessage);
          setFormErrorDetail(errorMessage);
        }
      )
      .finally(() => {
        setIsExecuting(false);
      });
  };

  const updateSelectedFiles = (event: ChangeEvent<HTMLInputElement>): void => {
    const { files: newFiles } = event.target;

    let newFileList = "";

    if (!newFiles || newFiles.length === 0) {
      return;
    }

    for (let i = 0; i < newFiles?.length; i++) {
      newFileList += `"${newFiles.item(i).name}"`;
    }
    setFiles(newFiles);
    setSelectedFilesTitle(newFileList);
  };

  const onImportLinkClick = (): void => {
    fileRef?.current?.click();
  };

  const onImportLinkKeyPress = (event: KeyboardEvent<HTMLAnchorElement>): void => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      onImportLinkClick();
    }
  };

  const _totalFileSizeForFileList = (fileList: FileList): number => {
    let totalFileSize = 0;
    for (let i = 0; i < fileList?.length; i++) {
      totalFileSize += fileList.item(i).size;
    }
    return totalFileSize;
  };

  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError,
    formErrorDetail,
    id: "uploaditemspane",
    isExecuting: isExecuting,
    title: getTitle(),
    submitButtonText: "Upload",
    isSubmitButtonHidden: selectedFilesTitle === "",
    onClose: closePanel,
    onSubmit,
  };
  const columns: IColumn[] = [
    {
      key: "fileName",
      name: "FILE NAME",
      fieldName: "fileName",
      minWidth: 140,
      maxWidth: 140,
    },
    {
      key: "status",
      name: "STATUS",
      fieldName: "numSucceeded",
      minWidth: 140,
      maxWidth: 140,
      isRowHeader: true,
      isResizable: true,
      data: "string",
      isPadded: true,
    },
  ];

  const _renderItemColumn = (item: IUploadFileData, index: number, column: IColumn) => {
    switch (column.key) {
      case "status":
        return <span>{item?.numSucceeded + " items created, " + item?.numFailed + " errors"}</span>;
      default:
        return <span>{item?.fileName}</span>;
    }
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneMainContent">
        <div>
          <div className="renewUploadItemsHeader">
            <span> Select JSON Files </span>
            <Tooltip>
              Select one or more JSON files to upload. Each file can contain a single JSON document or an array of JSON
              documents. The combined size of all files in an individual upload operation must be less than 2 MB. You
              can perform multiple upload operations for larger data sets.
            </Tooltip>
          </div>
          <input
            className="importFilesTitle"
            type="text"
            disabled
            value={selectedFilesTitle}
            aria-label="Select JSON Files"
          />
          <input
            type="file"
            id="importDocsInput"
            title="Upload Icon"
            multiple
            accept="application/json"
            role="button"
            ref={fileRef}
            tabIndex={0}
            style={{ display: "none" }}
            onChange={updateSelectedFiles}
          />
          <a href="#" id="fileImportLink" onClick={onImportLinkClick} onKeyPress={onImportLinkKeyPress}>
            <img
              className="fileImportImg"
              src={FolderIcon}
              alt="Select JSON files to upload"
              title="Select JSON files to upload"
            />
          </a>
        </div>
        {uploadFileDataVisible && (
          <div className="fileUploadSummaryContainer">
            <b>File upload status</b>
            <DetailsList
              items={uploadFileData}
              columns={columns}
              onRenderItemColumn={_renderItemColumn}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
            />
          </div>
        )}
      </div>
    </GenericRightPaneComponent>
  );
};
