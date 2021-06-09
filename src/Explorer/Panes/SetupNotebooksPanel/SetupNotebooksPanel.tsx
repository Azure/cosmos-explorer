import { PrimaryButton } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, KeyboardEvent, useState } from "react";
import { Areas, NormalizedEventKey } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import { createOrUpdate } from "../../../Utils/arm/generatedClients/cosmosNotebooks/notebookWorkspaces";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { PanelLoadingScreen } from "../PanelLoadingScreen";
interface SetupNoteBooksPanelProps {
  explorer: Explorer;
  panelTitle: string;
  panelDescription: string;
}

export const SetupNoteBooksPanel: FunctionComponent<SetupNoteBooksPanelProps> = ({
  explorer,
  panelTitle,
  panelDescription,
}: SetupNoteBooksPanelProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);

  const description = panelDescription;
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);

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
      paneTitle: panelTitle,
    });

    const clear = NotificationConsoleUtils.logConsoleProgress("Creating a new default notebook workspace");

    try {
      setLoadingTrue();
      await createOrUpdate(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        "default"
      );
      explorer.isAccountReady.valueHasMutated(); // re-trigger init notebooks

      closeSidePanel();

      TelemetryProcessor.traceSuccess(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: panelTitle,
        },
        startKey
      );
      NotificationConsoleUtils.logConsoleInfo("Successfully created a default notebook workspace for the account");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.CreateNotebookWorkspace,
        {
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: panelTitle,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      setErrorMessage(`Failed to setup a default notebook workspace: ${errorMessage}`);
      setShowErrorDetails(true);
      NotificationConsoleUtils.logConsoleError(`Failed to create a default notebook workspace: ${errorMessage}`);
    } finally {
      setLoadingFalse();
      clear();
    }
  };

  return (
    <form className="panelFormWrapper">
      {errorMessage && (
        <PanelInfoErrorComponent message={errorMessage} messageType="error" showErrorDetails={showErrorDetails} />
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
