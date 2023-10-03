import { TextField } from "@fluentui/react";
import * as ViewModels from "Contracts/ViewModels";
import { useTabs } from "hooks/useTabs";
import React, { FormEvent, FunctionComponent, useState } from "react";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "Utils/NotificationConsoleUtils";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { NotebookContentItem } from "../../Notebook/NotebookContentItem";
import NotebookV2Tab from "../../Tabs/NotebookV2Tab";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface StringInputPanelProps {
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
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const submit = async (): Promise<void> => {
    if (stringInput === "") {
      const errorMessage = "Please  " + inputLabel;
      setFormErrors(errorMessage);
      logConsoleError("Error while " + paneTitle + " : " + errorMessage);
      return;
    } else {
      setFormErrors("");
    }

    const clearMessage = logConsoleProgress(`${inProgressMessage} ${stringInput}`);
    try {
      const newNotebookFile: NotebookContentItem = await onSubmit(notebookFile, stringInput);
      logConsoleInfo(`${successMessage}: ${stringInput}`);
      const originalPath = notebookFile.path;

      const notebookTabs = useTabs
        .getState()
        .getTabs(
          ViewModels.CollectionTabKind.NotebookV2,
          (tab: NotebookV2Tab) => tab.notebookPath && FileSystemUtil.isPathEqual(tab.notebookPath(), originalPath),
        );
      notebookTabs.forEach((tab) => {
        tab.tabTitle(newNotebookFile.name);
        tab.tabPath(newNotebookFile.path);
        (tab as NotebookV2Tab).notebookPath(newNotebookFile.path);
      });
      closePanel();
    } catch (reason) {
      let error = reason;
      if (reason instanceof Error) {
        error = reason.message;
      } else if (typeof reason === "object") {
        error = JSON.stringify(reason);
      }

      if (reason?.response?.message) {
        error += `. ${reason.response.message}`;
      }

      setFormErrors(errorMessage);
      logConsoleError(`${errorMessage} ${stringInput}: ${error}`);
    } finally {
      setIsExecuting(false);
      clearMessage();
    }
  };
  const props: RightPaneFormProps = {
    formError: formErrors,
    isExecuting: isExecuting,
    submitButtonText: submitButtonLabel,
    onSubmit: submit,
  };
  return (
    <RightPaneForm {...props}>
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
    </RightPaneForm>
  );
};
