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
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
interface ISetupNoteBooksPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
  panelTitle: string;
  panelDescription: string;
}
export const SetupNoteBooksPanel: FunctionComponent<ISetupNoteBooksPanelProps> = ({
  explorer,
  closePanel,
  openNotificationConsole,
  panelTitle,
  panelDescription,
}: ISetupNoteBooksPanelProps): JSX.Element => {
  const title = panelTitle;
  const description = panelDescription;
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);

  useEffect(() => {
    resetData();
    open();
  }, []);

  const resetData = () => {
    setErrorMessage("");
    setShowErrorDetails(false);
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
      setErrorMessage("Failed to setup a default notebook workspace");
      setShowErrorDetails(true);
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
    <form className="panelFormWrapper" onSubmit={() => submit()}>
      {errorMessage && (
        <PanelInfoErrorComponent
          message={errorMessage}
          messageType="error"
          showErrorDetails={showErrorDetails}
          openNotificationConsole={openNotificationConsole}
        />
      )}
      <div className="panelMainContent">
        <div className="pkPadding">
          <div>{description}</div>
          <PrimaryButton
            id="completeSetupBtn"
            className="btncreatecoll1 btnSetupQueries"
            text="Complete Setup"
            onClick={onCompleteSetupClick}
            onKeyPress={onCompleteSetupKeyPress}
            aria-label="Complete setup"
          />
        </div>
      </div>
      {isLoading && <PanelLoadingScreen />}
    </form>
  );
};
