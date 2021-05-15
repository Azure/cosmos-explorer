import React, { ChangeEvent, FunctionComponent, useState } from "react";
import { Upload } from "../../../Common/Upload/Upload";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import { NotebookContentItem } from "../../Notebook/NotebookContentItem";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface UploadFilePanelProps {
  expandConsole: () => void;
  closePanel: () => void;
  uploadFile: (name: string, content: string) => Promise<NotebookContentItem>;
}

export const UploadFilePane: FunctionComponent<UploadFilePanelProps> = ({
  expandConsole,
  closePanel,
  uploadFile,
}: UploadFilePanelProps) => {
  const extensions: string = undefined; //ex. ".ipynb"
  const errorMessage = "Could not upload file";
  const inProgressMessage = "Uploading file to notebook server";
  const successMessage = "Successfully uploaded file to notebook server";

  const [files, setFiles] = useState<FileList>();
  const [formErrors, setFormErrors] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const submit = () => {
    setFormErrors("");
    if (!files || files.length === 0) {
      setFormErrors("No file specified. Please input a file.");
      logConsoleError(`${errorMessage} -- No file specified. Please input a file.`);
      return;
    }

    const file: File = files.item(0);

    const clearMessage = logConsoleProgress(`${inProgressMessage}: ${file.name}`);

    setIsExecuting(true);

    onSubmit(files.item(0))
      .then(
        () => {
          logConsoleInfo(`${successMessage} ${file.name}`);
          closePanel();
        },
        (error: string) => {
          setFormErrors(errorMessage);
          logConsoleError(`${errorMessage} ${file.name}: ${error}`);
        }
      )
      .finally(() => {
        setIsExecuting(false);
        clearMessage();
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

  const genericPaneProps: RightPaneFormProps = {
    expandConsole,
    formError: formErrors,
    isExecuting: isExecuting,
    submitButtonText: "Upload",
    onSubmit: submit,
  };

  return (
    <RightPaneForm {...genericPaneProps}>
      <div className="paneMainContent">
        <Upload label="Select file to upload" accept={extensions} onUpload={updateSelectedFiles} />
      </div>
    </RightPaneForm>
  );
};
