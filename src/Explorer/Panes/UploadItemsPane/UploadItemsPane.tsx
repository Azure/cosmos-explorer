import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode, TooltipHost } from "@fluentui/react";
import { Upload } from "Common/Upload/Upload";
import { UploadDetailsRecord } from "Contracts/ViewModels";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import React, { ChangeEvent, FunctionComponent, useState } from "react";
import { getErrorMessage } from "../../Tables/Utilities";
import { useSelectedNode } from "../../useSelectedNode";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export const UploadItemsPane: FunctionComponent = () => {
  const [files, setFiles] = useState<FileList>();
  const [uploadFileData, setUploadFileData] = useState<UploadDetailsRecord[]>([]);
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>();

  const onSubmit = () => {
    setFormError("");
    if (!files || files.length === 0) {
      setFormError("No files were specified. Please input at least one file.");
      logConsoleError("Could not upload items -- No files were specified. Please input at least one file.");
      return;
    }

    const selectedCollection = useSelectedNode.getState().findSelectedCollection();
    setIsExecuting(true);

    selectedCollection
      ?.uploadFiles(files)
      .then(
        (uploadDetails) => {
          setUploadFileData(uploadDetails.data);
          setFiles(undefined);
        },
        (error: Error) => {
          const errorMessage = getErrorMessage(error);
          setFormError(errorMessage);
        }
      )
      .finally(() => {
        setIsExecuting(false);
      });
  };

  const updateSelectedFiles = (event: ChangeEvent<HTMLInputElement>): void => {
    setFiles(event.target.files);
  };

  const props: RightPaneFormProps = {
    formError,
    isExecuting: isExecuting,
    submitButtonText: "Upload",
    onSubmit,
  };

  const renderStatusCell = (item: UploadDetailsRecord) => {
    const tooltipContent = `${item.numSucceeded} created, ${item.numThrottled} throttled, ${item.numFailed} errors`;
    return (
      <TooltipHost content={tooltipContent}>
        <span>{tooltipContent}</span>
      </TooltipHost>
    );
  };

  const renderFileNameCell = (item: UploadDetailsRecord) => {
    return (
      <TooltipHost content={item.fileName}>
        <span>{item.fileName}</span>
      </TooltipHost>
    );
  };

  const columns: IColumn[] = [
    {
      key: "fileName",
      name: "FILE NAME",
      fieldName: "fileName",
      minWidth: 140,
      maxWidth: 140,
      isRowHeader: true,
      isResizable: true,
      data: "string",
      isPadded: true,
      onRender: renderFileNameCell,
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
      onRender: renderStatusCell,
    },
  ];

  const _renderItemColumn = (item: UploadDetailsRecord, index: number, column: IColumn) => {
    switch (column.key) {
      case "status":
        return `${item.numSucceeded} created, ${item.numThrottled} throttled, ${item.numFailed} errors`;
      default:
        return item.fileName;
    }
  };

  return (
    <RightPaneForm {...props}>
      <div className="paneMainContent">
        <Upload
          label="Select JSON Files"
          onUpload={updateSelectedFiles}
          accept="application/json"
          multiple
          tabIndex={0}
          tooltip="Select one or more JSON files to upload. Each file can contain a single JSON document or an array of JSON documents. The combined size of all files in an individual upload operation must be less than 2 MB. You can perform multiple upload operations for larger data sets."
        />
        {uploadFileData?.length > 0 && (
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
    </RightPaneForm>
  );
};
