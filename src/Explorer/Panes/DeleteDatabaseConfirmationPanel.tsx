import { Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { Areas } from "Common/Constants";
import { deleteDatabase } from "Common/dataAccess/deleteDatabase";
import DeleteFeedback from "Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { Collection, Database } from "Contracts/ViewModels";
import { useSidePanel } from "hooks/useSidePanel";
import { useTabs } from "hooks/useTabs";
import React, { FunctionComponent, useState } from "react";
import { DefaultExperienceUtility } from "Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import { useDatabases } from "../useDatabases";
import { useSelectedNode } from "../useSelectedNode";
import { PanelInfoErrorComponent, PanelInfoErrorProps } from "./PanelInfoErrorComponent";
import { RightPaneForm, RightPaneFormProps } from "./RightPaneForm/RightPaneForm";

interface DeleteDatabaseConfirmationPanelProps {
  refreshDatabases: () => Promise<void>;
}

export const DeleteDatabaseConfirmationPanel: FunctionComponent<DeleteDatabaseConfirmationPanelProps> = ({
  refreshDatabases,
}: DeleteDatabaseConfirmationPanelProps): JSX.Element => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const isLastNonEmptyDatabase = useDatabases((state) => state.isLastNonEmptyDatabase);
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);

  const [formError, setFormError] = useState<string>("");
  const [databaseInput, setDatabaseInput] = useState<string>("");
  const [databaseFeedbackInput, setDatabaseFeedbackInput] = useState<string>("");
  const selectedDatabase: Database = useDatabases.getState().findSelectedDatabase();

  const submit = async (): Promise<void> => {
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
      closeSidePanel();
      refreshDatabases();
      useTabs.getState().closeTabsByComparator((tab) => tab.node?.id() === selectedDatabase.id());
      useSelectedNode.getState().setSelectedNode(undefined);
      selectedDatabase
        .collections()
        .forEach((collection: Collection) =>
          useTabs
            .getState()
            .closeTabsByComparator(
              (tab) =>
                tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId
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

      if (isLastNonEmptyDatabase()) {
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
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage);
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

  const props: RightPaneFormProps = {
    formError,
    isExecuting: isLoading,
    submitButtonText: "OK",
    onSubmit: () => submit(),
  };

  const errorProps: PanelInfoErrorProps = {
    messageType: "warning",
    showErrorDetails: false,
    message:
      "Warning! The action you are about to take cannot be undone. Continuing will permanently delete this resource and all of its children resources.",
  };
  const confirmDatabase = "Confirm by typing the database id";
  const reasonInfo = "Help us improve Azure Cosmos DB! What is the reason why you are deleting this database?";
  return (
    <RightPaneForm {...props}>
      {!formError && <PanelInfoErrorComponent {...errorProps} />}
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
            ariaLabel={confirmDatabase}
          />
        </div>
        {isLastNonEmptyDatabase() && (
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
              ariaLabel={reasonInfo}
            />
          </div>
        )}
      </div>
    </RightPaneForm>
  );
};
