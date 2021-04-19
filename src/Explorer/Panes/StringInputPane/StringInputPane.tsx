import { TextField } from "office-ui-fabric-react";
import React, { FormEvent, FunctionComponent, useState } from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { NotebookContentItem } from "../../Notebook/NotebookContentItem";
import NotebookV2Tab from "../../Tabs/NotebookV2Tab";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";

export interface StringInputPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  errorMessage: string;
  inProgressMessage: string;
  successMessage: string;
  inputLabel: string;
  paneTitle: string;
  submitButtonLabel: string;
  defaultInput: string;
  onSubmit: (notebookFile: NotebookContentItem, input: string) => Promise<NotebookContentItem>;
  notebookFile: NotebookContentItem;
}

export const StringInputPane: FunctionComponent<StringInputPanelProps> = ({
  explorer: container,
  closePanel,
  errorMessage,
  inProgressMessage,
  successMessage,
  inputLabel,
  paneTitle,
  submitButtonLabel,
  defaultInput,
  onSubmit,
  notebookFile,
}: StringInputPanelProps): JSX.Element => {
  const [stringInput, setStringInput] = useState<string>(defaultInput);
  const [formErrors, setFormErrors] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const submit = () => {
    console.log("stringInput", stringInput);
    if (stringInput === "") {
      const errorMessage = "Please  " + inputLabel;
      setFormErrors(errorMessage);
      logConsoleError("Error while " + paneTitle + " : " + errorMessage);
      return;
    } else {
      setFormErrors("");
      setFormErrorsDetails("");
    }

    const clearMessage = logConsoleProgress(`${inProgressMessage} ${stringInput}`);
    setIsExecuting(true);
    onSubmit(notebookFile, stringInput)
      .then((value: NotebookContentItem) => {
        logConsoleInfo(`${successMessage}: ${stringInput}`);
        const newNotebookFile = value;
        const originalPath = notebookFile.path;

        const notebookTabs = container.tabsManager.getTabs(
          ViewModels.CollectionTabKind.NotebookV2,
          (tab: NotebookV2Tab) => tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), originalPath)
        );
        notebookTabs.forEach((tab) => {
          tab.tabTitle(newNotebookFile.name);
          tab.tabPath(newNotebookFile.path);
          (tab as NotebookV2Tab).notebookPath(newNotebookFile.path);
        });
        closePanel();
      })
      .catch((reason) => {
        let error = reason;
        if (reason instanceof Error) {
          error = reason.message;
        } else if (typeof reason === "object") {
          error = JSON.stringify(reason);
        }

        // If it's an AjaxError (AjaxObservable), add more error
        if (reason?.response?.message) {
          error += `. ${reason.response.message}`;
        }

        setFormErrors(errorMessage);
        setFormErrorsDetails(`${errorMessage}: ${error}`);
        logConsoleError(`${errorMessage} ${stringInput}: ${error}`);
      })
      .finally(() => {
        setIsExecuting(false);
        clearMessage();
      });
  };
  const genericPaneProps: GenericRightPaneProps = {
    container: container,
    formError: formErrors,
    formErrorDetail: formErrorsDetails,
    id: "stringInputPane",
    isExecuting: isExecuting,
    title: paneTitle,
    submitButtonText: submitButtonLabel,
    onClose: closePanel,
    onSubmit: submit,
  };
  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneMainContent">
        <TextField
          label={inputLabel}
          name="collectionIdConfirmation"
          value={stringInput}
          autoFocus
          required
          onChange={(event: FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) =>
            setStringInput(newValue)
          }
          aria-label={inputLabel}
        />
      </div>
    </GenericRightPaneComponent>
  );
};
