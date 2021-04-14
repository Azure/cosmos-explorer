import { useBoolean } from "@uifabric/react-hooks";
import { PrimaryButton } from "office-ui-fabric-react";
import React, { FunctionComponent, KeyboardEvent, useEffect, useState } from "react";
import { Areas, NormalizedEventKey } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
interface ISetupNoteBooksPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  panelTitle: string;
  panelDescription: string;
}
export const SetupNoteBooksPanel: FunctionComponent<ISetupNoteBooksPanelProps> = ({
  explorer,
  closePanel,
  panelTitle,
  panelDescription,
}: ISetupNoteBooksPanelProps): JSX.Element => {
  const title = panelTitle;
  const description = panelDescription;
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "setupNoteBooksPanel",
    isExecuting: isLoading,
    title: title,
    submitButtonText: "",
    onClose: () => closePanel(),
    onSubmit: () => submit(),
    isFooterHidden: true,
  };

  useEffect(() => {
    resetData();
    open();
  }, []);

  const resetData = () => {
    setFormError("");
    setFormErrorsDetails("");
  };

  const open = () => {
    const completeSetupBtn = document.getElementById("completeSetupBtn");
    completeSetupBtn && completeSetupBtn.focus();
  };

  const submit = () => {
    // override default behavior because this is not a form
  };

  const onCompleteSetupClick = async () => {
    await setupNotebookWorkspace();
  };

  const onCompleteSetupKeyPress = async (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === NormalizedEventKey.Enter) {
      await setupNotebookWorkspace();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  const setupNotebookWorkspace = async (): Promise<void> => {
    if (!explorer) {
      return;
    }

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateNotebookWorkspace, {
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: title,
    });

    const id = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      "Creating a new default notebook workspace"
    );

    try {
      setLoadingTrue();
      await explorer.notebookWorkspaceManager.createNotebookWorkspaceAsync(
        userContext.databaseAccount && userContext.databaseAccount.id,
        "default"
      );
      explorer.isAccountReady.valueHasMutated(); // re-trigger init notebooks

      closePanel();

      TelemetryProcessor.traceSuccess(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
        },
        startKey
      );
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Info,
        "Successfully created a default notebook workspace for the account"
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: title,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );

      setFormError("Failed to setup a default notebook workspace");
      setFormErrorsDetails(`Failed to setup a default notebook workspace: ${errorMessage}`);
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to create a default notebook workspace: ${errorMessage}`
      );
    } finally {
      setLoadingFalse();
      NotificationConsoleUtils.clearInProgressMessageWithId(id);
    }
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneContentContainer">
        <div className="paneMainContent">
          <div className="pkPadding">
            <div>{description}</div>
            <PrimaryButton
              text="Complete Setup"
              onClick={onCompleteSetupClick}
              onKeyPress={onCompleteSetupKeyPress}
              aria-label="Complete setup"
            />
            {/* <button
              id="completeSetupBtn"
              className="btncreatecoll1 btnSetupQueries"
              type="button"
              aria-label="Complete setup"
              onClick={onCompleteSetupClick}
              onKeyPress={onCompleteSetupKeyPress}
            >
              Complete setup
            </button> */}
          </div>
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
