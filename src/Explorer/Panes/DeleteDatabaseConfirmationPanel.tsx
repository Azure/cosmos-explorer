import { Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { Areas } from "Common/Constants";
import DeleteFeedback from "Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { deleteDatabase } from "Common/dataAccess/deleteDatabase";
import { Collection, Database } from "Contracts/ViewModels";
import { DefaultExperienceUtility } from "Shared/DefaultExperienceUtility";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { getDatabaseName } from "Utils/APITypeUtils";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import { useSidePanel } from "hooks/useSidePanel";
import { useTabs } from "hooks/useTabs";
import React, { FunctionComponent, useState } from "react";
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
      setFormError(
        `Input ${getDatabaseName()} name "${databaseInput}" does not match the selected ${getDatabaseName()} "${selectedDatabase.id()}"`,
      );
      logConsoleError(`Error while deleting ${getDatabaseName()} ${selectedDatabase && selectedDatabase.id()}`);
      logConsoleError(
        `Input ${getDatabaseName()} name "${databaseInput}" does not match the selected ${getDatabaseName()} "${selectedDatabase.id()}"`,
      );
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
                tab.node?.id() === collection.id() && (tab.node as Collection).databaseId === collection.databaseId,
            ),
        );
      TelemetryProcessor.traceSuccess(
        Action.DeleteDatabase,
        {
          databaseId: selectedDatabase.id(),
          dataExplorerArea: Areas.ContextualPane,
          paneTitle: "Delete Database",
        },
        startKey,
      );

      if (isLastNonEmptyDatabase()) {
        const deleteFeedback = new DeleteFeedback(
          userContext?.databaseAccount.id,
          userContext?.databaseAccount.name,
          DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType),
          databaseFeedbackInput,
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
        startKey,
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
  const confirmDatabase = `Confirm by typing the ${getDatabaseName()} id (name)`;
  const reasonInfo = `Help us improve Azure Cosmos DB! What is the reason why you are deleting this ${getDatabaseName()}?`;
  return (
    <RightPaneForm {...props}>
      {!formError && <PanelInfoErrorComponent {...errorProps} />}
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small">{confirmDatabase}</Text>
          <TextField
            id="confirmDatabaseId"
            data-testid="DeleteDatabaseConfirmationPanel/ConfirmInput"
            autoFocus
            styles={{ fieldGroup: { width: 300 } }}
            onChange={(event, newInput?: string) => {
              setDatabaseInput(newInput);
            }}
            ariaLabel={confirmDatabase}
            required
          />
        </div>
        {isLastNonEmptyDatabase() && (
          <div className="deleteDatabaseFeedback">
            <Text variant="small" block>
              Help us improve Azure Cosmos DB!
            </Text>
            <Text variant="small" block>
              What is the reason why you are deleting this {getDatabaseName()}?
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
