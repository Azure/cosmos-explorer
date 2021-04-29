import { useBoolean } from "@fluentui/react-hooks";
import { Text, TextField } from "@fluentui/react";
import React, { FunctionComponent, useState } from "react";
import { Areas } from "../../Common/Constants";
import { deleteDatabase } from "../../Common/dataAccess/deleteDatabase";
import DeleteFeedback from "../../Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { Collection, Database } from "../../Contracts/ViewModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { PanelFooterComponent } from "./PanelFooterComponent";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "./PanelInfoErrorComponent";
import { PanelLoadingScreen } from "./PanelLoadingScreen";

interface DeleteDatabaseConfirmationPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
  selectedDatabase: Database;
}

export const DeleteDatabaseConfirmationPanel: FunctionComponent<DeleteDatabaseConfirmationPanelProps> = (
  props: DeleteDatabaseConfirmationPanelProps
): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);

  const [formError, setFormError] = useState<string>("");
  const [databaseInput, setDatabaseInput] = useState<string>("");
  const [databaseFeedbackInput, setDatabaseFeedbackInput] = useState<string>("");

  const getPanelErrorProps = (): PanelInfoErrorProps => {
    if (formError) {
      return {
        messageType: "error",
        message: formError,
        showErrorDetails: true,
        openNotificationConsole: props.openNotificationConsole,
      };
    }

    return {
      messageType: "warning",
      showErrorDetails: false,
      message:
        "Warning! The action you are about to take cannot be undone. Continuing will permanently delete this resource and all of its children resources.",
    };
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    const { selectedDatabase, explorer } = props;
    event.preventDefault();
    if (selectedDatabase?.id() && databaseInput !== selectedDatabase.id()) {
      setFormError("Input database name does not match the selected database");
      logConsoleError(`Error while deleting collection ${selectedDatabase && selectedDatabase.id()}`);
      return;
    }
    setFormError("");
    setLoadingTrue();

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDatabase, {
      databaseId: selectedDatabase.id(),
      dataExplorerArea: Areas.ContextualPane,
      paneTitle: "Delete Database",
    });

    try {
      await deleteDatabase(selectedDatabase.id());
      props.closePanel();
      explorer.refreshAllDatabases();
      explorer.tabsManager.closeTabsByComparator((tab) => tab.node?.id() === selectedDatabase.id());
      explorer.selectedNode(undefined);
      selectedDatabase
        .collections()
        .forEach((collection: Collection) =>
          explorer.tabsManager.closeTabsByComparator(
            (tab) => tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
          )
        );
      TelemetryProcessor.traceSuccess(
        Action.DeleteDatabase,
        {
          databaseId: selectedDatabase.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Database",
        },
        startKey
      );

      if (shouldRecordFeedback()) {
        const deleteFeedback = new DeleteFeedback(
          userContext?.databaseAccount.id,
          userContext?.databaseAccount.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType),
          databaseFeedbackInput
        );

        TelemetryProcessor.trace(Action.DeleteDatabase, ActionModifiers.Mark, {
          message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback)),
        });
      }
    } catch (error) {
      setLoadingFalse();
      setFormError(error);
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.DeleteDatabase,
        {
          databaseId: selectedDatabase.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Database",
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
  };

  const shouldRecordFeedback = (): boolean => {
    const { explorer } = props;
    return explorer.isLastNonEmptyDatabase() || (explorer.isLastDatabase() && explorer.isSelectedDatabaseShared());
  };

  return (
    <form className="panelFormWrapper" onSubmit={submit}>
      <PanelInfoErrorComponent {...getPanelErrorProps()} />
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small">Confirm by typing the database id</Text>
          <TextField
            id="confirmDatabaseId"
            autoFocus
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              setDatabaseInput(newInput);
            }}
          />
        </div>
        {shouldRecordFeedback() && (
          <div className="deleteDatabaseFeedback">
            <Text variant="small" block>
              Help us improve Azure Cosmos DB!
            </Text>
            <Text variant="small" block>
              What is the reason why you are deleting this database?
            </Text>
            <TextField
              id="deleteDatabaseFeedbackInput"
              styles={{ fieldGroup: { width: 300 } }}
              multiline
              rows={3}
              onChange={(event, newInput?: string) => {
                setDatabaseFeedbackInput(newInput);
              }}
            />
          </div>
        )}
      </div>
      <PanelFooterComponent buttonLabel="OK" />
      {isLoading && <PanelLoadingScreen />}
    </form>
  );
};
