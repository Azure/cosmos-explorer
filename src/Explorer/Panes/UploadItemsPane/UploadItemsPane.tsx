import {
  DetailsList,
  DetailsListLayoutMode,
  DirectionalHint,
  FontIcon,
  getTheme,
  IColumn,
  IDetailsListStyles,
  mergeStyles,
  mergeStyleSets,
  SelectionMode,
  TooltipHost,
} from "@fluentui/react";
import { Upload } from "Common/Upload/Upload";
import { UploadDetailsRecord } from "Contracts/ViewModels";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import React, { ChangeEvent, FunctionComponent, useReducer, useState } from "react";
import { getErrorMessage } from "../../Tables/Utilities";
import { useSelectedNode } from "../../useSelectedNode";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

const theme = getTheme();
const iconClass = mergeStyles({
  verticalAlign: "middle",
  maxHeight: "16px",
  maxWidth: "16px",
});

const classNames = mergeStyleSets({
  fileIconHeaderIcon: {
    padding: 0,
    fontSize: "16px",
  },
  fileIconCell: {
    textAlign: "center",
    selectors: {
      "&:before": {
        content: ".",
        display: "inline-block",
        verticalAlign: "middle",
        height: "100%",
        width: "0px",
        visibility: "hidden",
      },
    },
  },
  error: [{ color: theme.semanticColors.errorIcon }, iconClass],
  accept: [{ color: theme.semanticColors.successIcon }, iconClass],
  warning: [{ color: theme.semanticColors.warningIcon }, iconClass],
});

export type UploadItemsPaneProps = {
  onUpload?: (data: UploadDetailsRecord[]) => void;
};

export const UploadItemsPane: FunctionComponent<UploadItemsPaneProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<FileList>();
  const [uploadFileData, setUploadFileData] = useState<UploadDetailsRecord[]>([]);
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>();
  const [reducer, setReducer] = useReducer((x) => x + 1, 1);

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
          setReducer(); // Trigger a re-render to update the UI with new upload details
          // Emit the upload details to the parent component
          onUpload && onUpload(uploadDetails.data);
        },
        (error: Error) => {
          const errorMessage = getErrorMessage(error);
          setFormError(errorMessage);
        },
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
    isSubmitButtonDisabled: !files || files.length === 0,
    submitButtonText: "Upload",
    onSubmit,
  };

  const columns: IColumn[] = [
    {
      key: "icons",
      name: "",
      fieldName: "",
      className: classNames.fileIconCell,
      iconClassName: classNames.fileIconHeaderIcon,
      isIconOnly: true,
      minWidth: 16,
      maxWidth: 16,
      onRender: (item: UploadDetailsRecord, index: number, column: IColumn) => {
        if (item.numFailed) {
          const errorList = (
            <ul
              aria-label={"error list"}
              style={{
                margin: "5px 0",
                paddingLeft: "20px",
                listStyleType: "disc", // Explicitly set to use bullets (dots)
              }}
            >
              {item.errors.map((error, i) => (
                <li key={i} style={{ display: "list-item" }}>
                  {error}
                </li>
              ))}
            </ul>
          );

          return (
            <TooltipHost
              content={errorList}
              id={`tooltip-${index}-${column.key}`}
              directionalHint={DirectionalHint.bottomAutoEdge}
            >
              <FontIcon iconName="Error" className={classNames.error} aria-label="error" />
            </TooltipHost>
          );
        } else if (item.numThrottled) {
          return <FontIcon iconName="Warning" className={classNames.warning} aria-label="warning" />;
        } else {
          return <FontIcon iconName="Accept" className={classNames.accept} aria-label="accept" />;
        }
      },
    },
    {
      key: "fileName",
      name: "FILE NAME",
      fieldName: "fileName",
      minWidth: 120,
      maxWidth: 140,
      onRender: (item: UploadDetailsRecord, index: number, column: IColumn) => {
        const fieldContent = item.fileName;
        return (
          <TooltipHost
            content={fieldContent}
            id={`tooltip-${index}-${column.key}`}
            directionalHint={DirectionalHint.bottomAutoEdge}
          >
            {fieldContent}
          </TooltipHost>
        );
      },
    },
    {
      key: "status",
      name: "STATUS",
      fieldName: "numSucceeded",
      minWidth: 120,
      maxWidth: 140,
      isRowHeader: true,
      isResizable: true,
      data: "string",
      isPadded: true,
      onRender: (item: UploadDetailsRecord, index: number, column: IColumn) => {
        const fieldContent = `${item.numSucceeded} created, ${item.numThrottled} throttled, ${item.numFailed} errors`;
        return (
          <TooltipHost
            content={fieldContent}
            id={`tooltip-${index}-${column.key}`}
            directionalHint={DirectionalHint.bottomAutoEdge}
          >
            {fieldContent}
          </TooltipHost>
        );
      },
    },
  ];

  return (
    <RightPaneForm {...props}>
      <div className="paneMainContent">
        <Upload
          key={reducer} // Force re-render on state change
          label="Select JSON Files"
          onUpload={updateSelectedFiles}
          accept="application/json"
          multiple
          tabIndex={0}
          tooltip="Select one or more JSON files to upload. Each file can contain a single JSON document or an array of JSON documents. The combined size of all files in an individual upload operation must be less than 2 MB. You can perform multiple upload operations for larger data sets."
        />
        {uploadFileData?.length > 0 && (
          <div className="fileUploadSummaryContainer">
            <b style={{ color: "var(--colorNeutralForeground1)" }}>File upload status</b>
            <DetailsList
              items={uploadFileData}
              columns={columns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
              styles={
                {
                  root: {
                    backgroundColor: "var(--colorNeutralBackground1)",
                  },
                  headerWrapper: {
                    backgroundColor: "var(--colorNeutralBackground2)",
                  },
                  contentWrapper: {
                    backgroundColor: "var(--colorNeutralBackground1)",
                  },
                } as IDetailsListStyles
              }
            />
          </div>
        )}
      </div>
    </RightPaneForm>
  );
};
