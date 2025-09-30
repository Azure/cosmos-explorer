import { IImageProps, Image, ImageFit, Stack, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, useState } from "react";
import folderIcon from "../../../../images/folder_16x16.svg";
import { logError } from "../../../Common/Logger";
import { Collection } from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { userContext } from "../../../UserContext";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import { useSelectedNode } from "../../useSelectedNode";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export const LoadQueryPane: FunctionComponent = (): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList>();

  const imageProps: Partial<IImageProps> = {
    imageFit: ImageFit.centerCover,
    width: 20,
    height: 20,
    className: "fileIcon",
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target;
    setSelectedFiles(files);
    setSelectedFileName(files && files[0] && `"${files[0].name}"`);
  };

  const submit = async (): Promise<void> => {
    setFormError("");
    if (!selectedFiles || selectedFiles.length === 0) {
      setFormError("No file specified");
      logConsoleError("Could not load query -- No file specified. Please input a file.");
      return;
    }

    const file: File = selectedFiles[0];
    logConsoleProgress(`Loading query from file ${file.name}`);
    setLoadingTrue();
    try {
      await loadQueryFromFile(file);
      logConsoleInfo(`Successfully loaded query from file ${file.name}`);
      closeSidePanel();
      setLoadingFalse();
    } catch (error) {
      setLoadingFalse();
      setFormError("Failed to load query");
      logConsoleError(`Failed to load query from file ${file.name}: ${error}`);
    }
  };

  const loadQueryFromFile = async (file: File): Promise<void> => {
    const selectedCollection: Collection = useSelectedNode.getState().findSelectedCollection();
    const reader = new FileReader();
    let fileData: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reader.onload = (evt: any): void => {
      fileData = evt.target.result;

      if (!selectedCollection) {
        logError("No collection was selected", "LoadQueryPane.loadQueryFromFile");
      } else if (userContext.apiType === "Mongo") {
        selectedCollection.onNewMongoQueryClick(selectedCollection, undefined);
      } else {
        selectedCollection.onNewQueryClick(selectedCollection, undefined, fileData);
      }
    };

    reader.onerror = (): void => {
      setFormError("Failed to load query");
      logConsoleError(`Failed to load query from file ${file.name}`);
    };
    return reader.readAsText(file);
  };
  const props: RightPaneFormProps = {
    formError: formError,
    isExecuting: isLoading,
    submitButtonText: "Load",
    onSubmit: () => submit(),
  };

  return (
    <RightPaneForm {...props}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <Stack horizontal>
            <TextField
              id="confirmCollectionId"
              label="Select a query document"
              value={selectedFileName}
              autoFocus
              readOnly
              styles={{
                fieldGroup: { width: 300, color: "var(--colorNeutralForeground1)" },
                subComponentStyles: {
                  label: {
                    root: { color: "var(--colorNeutralForeground1)" },
                  },
                },
              }}
            />
            <label htmlFor="importQueryInputId" className="customFileUpload">
              <Image {...imageProps} src={folderIcon} alt="upload files" />
              <input
                className="fileUpload"
                type="file"
                id="importQueryInputId"
                accept="text/plain"
                onChange={onFileSelected}
              />
            </label>
          </Stack>
        </div>
      </div>
    </RightPaneForm>
  );
};
