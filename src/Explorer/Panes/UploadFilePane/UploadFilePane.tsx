import { Upload } from "Common/Upload/Upload";
import { useSidePanel } from "hooks/useSidePanel";
import React, { ChangeEvent, FunctionComponent, useState } from "react";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "Utils/NotificationConsoleUtils";
import { NotebookContentItem } from "../../Notebook/NotebookContentItem";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface UploadFilePanelProps {
  uploadFile: (name: string, content: string) => Promise<NotebookContentItem>;
}

export const UploadFilePane: FunctionComponent<UploadFilePanelProps> = ({ uploadFile }: UploadFilePanelProps) => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
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
          closeSidePanel();
        },
        (error: string) => {
          setFormErrors(errorMessage);
          logConsoleError(`${errorMessage} ${file.name}: ${error}`);
        },
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

  const props: RightPaneFormProps = {
    formError: formErrors,
    isExecuting: isExecuting,
    submitButtonText: "Upload",
    onSubmit: submit,
  };

  return (
    <RightPaneForm {...props}>
      <div className="paneMainContent">
        <Upload label="Select file to upload" accept={extensions} onUpload={updateSelectedFiles} />
      </div>
    </RightPaneForm>
  );
};
