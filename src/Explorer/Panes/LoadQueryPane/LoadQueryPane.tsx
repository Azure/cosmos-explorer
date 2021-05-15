import { IImageProps, Image, ImageFit, Stack, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, useState } from "react";
import folderIcon from "../../../../images/folder_16x16.svg";
import { logError } from "../../../Common/Logger";
import { Collection } from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import QueryTab from "../../Tabs/QueryTab";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";

interface LoadQueryPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const LoadQueryPane: FunctionComponent<LoadQueryPaneProps> = ({
  explorer,
  closePanel,
}: LoadQueryPaneProps): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList>();

  const imageProps: Partial<IImageProps> = {
    imageFit: ImageFit.centerCover,
    width: 20,
    height: 20,
    className: "fileIcon",
  };

  const title = "Load Query";
  const genericPaneProps: GenericRightPaneProps = {
    expandConsole: () => explorer.expandConsole(),
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "loadQueryPane",
    isExecuting: isLoading,
    title,
    submitButtonText: "Load",
    onClose: () => closePanel(),
    onSubmit: () => submit(),
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target;
    setSelectedFiles(files);
    setSelectedFileName(files && files[0] && `"${files[0].name}"`);
  };

  const submit = async (): Promise<void> => {
    setFormError("");
    setFormErrorsDetails("");
    if (!selectedFiles || selectedFiles.length === 0) {
      setFormError("No file specified");
      setFormErrorsDetails("No file specified. Please input a file.");
      logConsoleError("Could not load query -- No file specified. Please input a file.");
      return;
    }

    const file: File = selectedFiles[0];
    logConsoleProgress(`Loading query from file ${file.name}`);
    setLoadingTrue();
    try {
      await loadQueryFromFile(file);
      logConsoleInfo(`Successfully loaded query from file ${file.name}`);
      closePanel();
      setLoadingFalse();
    } catch (error) {
      setLoadingFalse();
      setFormError("Failed to load query");
      setFormErrorsDetails(`Failed to load query: ${error}`);
      logConsoleError(`Failed to load query from file ${file.name}: ${error}`);
    }
  };

  const loadQueryFromFile = async (file: File): Promise<void> => {
    const selectedCollection: Collection = explorer?.findSelectedCollection();
    if (!selectedCollection) {
      logError("No collection was selected", "LoadQueryPane.loadQueryFromFile");
    } else if (userContext.apiType === "Mongo") {
      selectedCollection.onNewMongoQueryClick(selectedCollection, undefined);
    } else {
      selectedCollection.onNewQueryClick(selectedCollection, undefined);
    }
    const reader = new FileReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reader.onload = (evt: any): void => {
      const fileData: string = evt.target.result;
      const queryTab = explorer.tabsManager.activeTab() as QueryTab;
      queryTab.initialEditorContent(fileData);
      queryTab.sqlQueryEditorContent(fileData);
    };

    reader.onerror = (): void => {
      setFormError("Failed to load query");
      setFormErrorsDetails(`Failed to load query`);
      logConsoleError(`Failed to load query from file ${file.name}`);
    };
    return reader.readAsText(file);
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <Stack horizontal>
            <TextField
              id="confirmCollectionId"
              label="Select a query document"
              value={selectedFileName}
              readOnly
              styles={{ fieldGroup: { width: 300 } }}
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
    </GenericRightPaneComponent>
  );
};
