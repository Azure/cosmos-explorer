import { Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { Areas } from "Common/Constants";
import DeleteFeedback from "Common/DeleteFeedback";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { deleteDatabase } from "Common/dataAccess/deleteDatabase";
import { Collection, Database } from "Contracts/ViewModels";
import { Keys } from "Localization/Keys.generated";
import { t } from "Localization/t";
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

const themedTextFieldStyles = {
  fieldGroup: {
    width: 300,
    backgroundColor: "var(--colorNeutralBackground1)",
    borderColor: "var(--colorNeutralStroke1)",
    selectors: {
      ":hover": { borderColor: "var(--colorNeutralStroke1Hover)" },
    },
  },
  field: {
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  subComponentStyles: {
    label: { root: { color: "var(--colorNeutralForeground1)" } },
  },
};

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
        t(Keys.panes.deleteDatabase.inputMismatch, {
          databaseName: getDatabaseName(),
          input: databaseInput,
          selectedId: selectedDatabase.id(),
        }),
      );
      logConsoleError(`Error while deleting ${getDatabaseName()} ${selectedDatabase && selectedDatabase.id()}`);
      logConsoleError(
        t(Keys.panes.deleteDatabase.inputMismatch, {
          databaseName: getDatabaseName(),
          input: databaseInput,
          selectedId: selectedDatabase.id(),
        }),
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
    submitButtonText: t(Keys.common.ok),
    onSubmit: () => submit(),
  };

  const errorProps: PanelInfoErrorProps = {
    messageType: "warning",
    showErrorDetails: false,
    message: t(Keys.panes.deleteDatabase.warningMessage),
  };
  const confirmDatabase = t(Keys.panes.deleteDatabase.confirmPrompt, { databaseName: getDatabaseName() });
  const reasonInfo =
    t(Keys.panes.deleteDatabase.feedbackTitle) +
    " " +
    t(Keys.panes.deleteDatabase.feedbackReason, { databaseName: getDatabaseName() });
  return (
    <RightPaneForm {...props}>
      {!formError && <PanelInfoErrorComponent {...errorProps} />}
      <div className="panelMainContent">
        <div className="confirmDeleteInput">
          <span className="mandatoryStar">* </span>
          <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>{confirmDatabase}</Text>
          <TextField
            id="confirmDatabaseId"
            data-test="Input:confirmDatabaseId"
            autoFocus
            styles={themedTextFieldStyles}
            onChange={(event, newInput?: string) => {
              setDatabaseInput(newInput);
            }}
            ariaLabel={confirmDatabase}
            required
          />
        </div>
        {isLastNonEmptyDatabase() && (
          <div className="deleteDatabaseFeedback">
            <Text variant="small" block style={{ color: "var(--colorNeutralForeground1)" }}>
              {t(Keys.panes.deleteDatabase.feedbackTitle)}
            </Text>
            <Text variant="small" block style={{ color: "var(--colorNeutralForeground1)" }}>
              {t(Keys.panes.deleteDatabase.feedbackReason, { databaseName: getDatabaseName() })}
            </Text>
            <TextField
              id="deleteDatabaseFeedbackInput"
              styles={themedTextFieldStyles}
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
