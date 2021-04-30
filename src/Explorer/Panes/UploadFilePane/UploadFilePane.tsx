import { Upload } from "Common/Upload/Upload";
import React, { ChangeEvent, FunctionComponent, useState } from "react";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { NotebookContentItem } from "../../Notebook/NotebookContentItem";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";

export interface UploadFilePanelProps {
  explorer: Explorer;
  closePanel: () => void;
  uploadFile: (name: string, content: string) => Promise<NotebookContentItem>;
}

export const UploadFilePane: FunctionComponent<UploadFilePanelProps> = ({
  explorer: container,
  closePanel,
  uploadFile,
}: UploadFilePanelProps) => {
  const title = "Upload file to notebook server";
  const submitButtonLabel = "Upload";
  const selectFileInputLabel = "Select file to upload";
  const extensions: string = undefined; //ex. ".ipynb"
  const errorMessage = "Could not upload file";
  const inProgressMessage = "Uploading file to notebook server";
  const successMessage = "Successfully uploaded file to notebook server";

  const [files, setFiles] = useState<FileList>();
  const [formErrors, setFormErrors] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const submit = () => {
    setFormErrors("");
    setFormErrorsDetails("");
    if (!files || files.length === 0) {
      setFormErrors("No file specified");
      setFormErrorsDetails("No file specified. Please input a file.");
      logConsoleError(`${errorMessage} -- No file specified. Please input a file.`);
      return;
    }

    const file: File = files.item(0);
    // const id: string = logConsoleProgress(
    //   `${inProgressMessage}: ${file.name}`
    // );

    logConsoleProgress(`${inProgressMessage}: ${file.name}`);

    setIsExecuting(true);

    onSubmit(files.item(0))
      .then(
        () => {
          logConsoleInfo(`${successMessage} ${file.name}`);
          closePanel();
        },
        (error: string) => {
          setFormErrors(errorMessage);
          setFormErrorsDetails(`${errorMessage}: ${error}`);
          logConsoleError(`${errorMessage} ${file.name}: ${error}`);
        }
      )
      .finally(() => {
        setIsExecuting(false);
        // clearInProgressMessageWithId(id);
      });
  };

  const updateSelectedFiles = (event: ChangeEvent<HTMLInputElement>): void => {
    setFiles(event.target.files);
  };

  const onSubmit = async (file: File): Promise<NotebookContentItem> => {
    const readFileAsText = (inputFile: File): Promise<string> => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(`Problem parsing file: ${inputFile}`);
        };
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsText(inputFile);
      });
    };

    const fileContent = await readFileAsText(file);
    return uploadFile(file.name, fileContent);
  };

  const genericPaneProps: GenericRightPaneProps = {
    container: container,
    formError: formErrors,
    formErrorDetail: formErrorsDetails,
    id: "uploadFilePane",
    isExecuting: isExecuting,
    title,
    submitButtonText: submitButtonLabel,
    onClose: closePanel,
    onSubmit: submit,
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneMainContent">
        <Upload label={selectFileInputLabel} accept={extensions} onUpload={updateSelectedFiles} />
      </div>
    </GenericRightPaneComponent>
  );
};
